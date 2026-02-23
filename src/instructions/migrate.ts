import {
    Commitment,
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    createAssociatedTokenAccountIdempotentInstruction,
    getAccount,
    getAssociatedTokenAddressSync,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { OnlinePumpAmmSdk, PumpAmmSdk } from "@pump-fun/pump-swap-sdk";
import { Apyx } from "../idl";
import { DEFAULT_COMMITMENT, TOKEN_2022_PROGRAM_ID } from "../constants";
import { TransactionResult } from "../types";
import { deriveBondingCurvePda, deriveConfigPda } from "../helpers/pda";

/** migrate instruction discriminator (first 8 bytes of sha256("global:migrate")) */
const MIGRATE_DISCRIMINATOR = Buffer.from([155, 234, 231, 146, 236, 158, 162, 30]);
/** PumpSwap create_pool discriminator (from pump_amm IDL). */
const CREATE_POOL_DISCRIMINATOR = Buffer.from([233, 146, 209, 142, 207, 104, 64, 188]);
/** Anchor-serialized args offset for create_pool.coin_creator. */
const CREATE_POOL_COIN_CREATOR_OFFSET = 8 + 2 + 8 + 8;

export interface MigrateParams {
    /** Signer: must equal config.delegated_resolve_authority (e.g. post-trade service keypair). */
    authority: PublicKey;
    mint: PublicKey;
    /** PumpSwap pool index (default 0). */
    poolIndex?: number;
    /** Deprecated: no-op with official PumpSwap SDK createPoolInstructions flow. */
    isMayhemMode?: boolean;
    /** Optional override for PumpSwap coin_creator. Defaults to bonding_curve.creator. */
    coinCreator?: PublicKey | null;
}

function applyCreatePoolCoinCreator(
    instructions: TransactionInstruction[],
    coinCreator: PublicKey,
): TransactionInstruction[] {
    let replaced = false;

    const patched = instructions.map((ix) => {
        const data = Buffer.from(ix.data);
        if (
            data.length >= CREATE_POOL_COIN_CREATOR_OFFSET + 32 &&
            data.subarray(0, 8).equals(CREATE_POOL_DISCRIMINATOR)
        ) {
            const updated = Buffer.from(data);
            updated.set(coinCreator.toBuffer(), CREATE_POOL_COIN_CREATOR_OFFSET);
            replaced = true;
            return new TransactionInstruction({
                programId: ix.programId,
                keys: ix.keys,
                data: updated,
            });
        }
        return ix;
    });

    if (!replaced) {
        throw new Error("Failed to locate PumpSwap create_pool instruction for coin_creator override");
    }

    return patched;
}

/**
 * Build a migrate transaction.
 *
 * Flow:
 * 1) Apyx migrate moves base tokens and quote SOL from bonding curve -> authority and takes protocol fee.
 * 2) SDK appends official PumpSwap SDK createPool instructions (includes WSOL handling).
 */
export async function buildMigrateTx(
    program: Program<Apyx>,
    connection: Connection,
    params: MigrateParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const programId = program.programId;
    const [configPDA] = deriveConfigPda(programId);
    const configAccount = await program.account.config.fetch(configPDA);

    const [bondingCurvePDA] = deriveBondingCurvePda(params.mint, programId);
    const bondingCurveAccount = await program.account.bondingCurveAccount.fetch(bondingCurvePDA);
    const associatedBondingCurve = getAssociatedTokenAddressSync(
        params.mint,
        bondingCurvePDA,
        true,
        TOKEN_2022_PROGRAM_ID,
    );
    const associatedAuthorityBase = getAssociatedTokenAddressSync(
        params.mint,
        params.authority,
        false,
        TOKEN_2022_PROGRAM_ID,
    );
    const authorityWsolAta = getAssociatedTokenAddressSync(
        NATIVE_MINT,
        params.authority,
        false,
        SPL_TOKEN_PROGRAM_ID,
    );

    const curveAccountInfo = await connection.getAccountInfo(bondingCurvePDA, commitment);
    if (!curveAccountInfo) {
        throw new Error(`Bonding curve not found: ${bondingCurvePDA.toBase58()}`);
    }

    const curveRent = await connection.getMinimumBalanceForRentExemption(
        curveAccountInfo.data.length,
        commitment,
    );
    const availableSol =
        curveAccountInfo.lamports > curveRent
            ? BigInt(curveAccountInfo.lamports - curveRent)
            : 0n;

    const graduationFeeRaw = (configAccount as any).graduationFeeLamports ?? (configAccount as any).graduation_fee_lamports;
    const graduationFee = BigInt(graduationFeeRaw.toString());
    if (availableSol < graduationFee) {
        throw new Error(
            `Insufficient SOL for graduation fee: available=${availableSol.toString()} fee=${graduationFee.toString()}`,
        );
    }
    const solForPool = availableSol - graduationFee;
    if (solForPool <= 0n) {
        throw new Error("No SOL left for pool after graduation fee");
    }

    const baseAccount = await getAccount(
        connection,
        associatedBondingCurve,
        commitment,
        TOKEN_2022_PROGRAM_ID,
    );
    const baseAmountIn = baseAccount.amount;
    if (baseAmountIn <= 0n) {
        throw new Error("No base tokens left on bonding curve ATA for pool creation");
    }

    const createAuthorityBaseAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        params.authority,
        associatedAuthorityBase,
        params.authority,
        params.mint,
        TOKEN_2022_PROGRAM_ID,
    );

    // Account order must match Rust Migrate struct.
    const migrateKeys = [
        { pubkey: params.authority, isSigner: true, isWritable: true },
        { pubkey: params.mint, isSigner: false, isWritable: false },
        { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },
        { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
        { pubkey: associatedAuthorityBase, isSigner: false, isWritable: true },
        { pubkey: configPDA, isSigner: false, isWritable: false },
        { pubkey: configAccount.protocolFeeVault, isSigner: false, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const migrateIx = new TransactionInstruction({
        programId,
        keys: migrateKeys,
        data: MIGRATE_DISCRIMINATOR,
    });

    const onlinePumpAmmSdk = new OnlinePumpAmmSdk(connection);
    const pumpAmmSdk = new PumpAmmSdk();
    const resolvedCoinCreator =
        params.coinCreator ??
        ((bondingCurveAccount as any).creator
            ? new PublicKey((bondingCurveAccount as any).creator)
            : null);
    if (!resolvedCoinCreator) {
        throw new Error("Missing bonding curve creator for PumpSwap coin_creator");
    }

    const createPoolSolanaState = await onlinePumpAmmSdk.createPoolSolanaState(
        params.poolIndex ?? 0,
        params.authority,
        params.mint,
        NATIVE_MINT,
        associatedAuthorityBase,
        authorityWsolAta,
    );

    const createPoolInstructions = await pumpAmmSdk.createPoolInstructions(
        createPoolSolanaState,
        new BN(baseAmountIn.toString()),
        new BN(solForPool.toString()),
    );
    const patchedCreatePoolInstructions = applyCreatePoolCoinCreator(
        createPoolInstructions,
        resolvedCoinCreator,
    );

    const tx = new Transaction().add(
        createAuthorityBaseAtaIx,
        migrateIx,
        ...patchedCreatePoolInstructions,
    );

    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = params.authority;

    const serializedTransaction = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serializedTransaction.toString("base64"),
        userWallet: params.authority.toBase58(),
    };
}
