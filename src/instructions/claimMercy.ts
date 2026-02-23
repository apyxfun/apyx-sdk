import {
    Transaction,
    PublicKey,
    Connection,
    Commitment,
    SystemProgram,
    TransactionInstruction,
    SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult } from "../types";
import {
    deriveConfigPda,
    deriveBondingCurvePda,
    deriveMercyVaultPda,
} from "../helpers/pda";

/** claim_mercy instruction discriminator (first 8 bytes of sha256("global:claim_mercy")) */
const CLAIM_MERCY_DISCRIMINATOR = Buffer.from([124, 17, 216, 11, 201, 49, 68, 203]);

export interface ClaimMercyParams {
    /** Signer: self-claim when equal to beneficiary; delegated claim when relayer key. */
    authority: PublicKey;
    /** Wallet whose loser balance is used and who receives winner tokens. Defaults to authority (self-claim). */
    beneficiary?: PublicKey;
    duel: PublicKey;
    /** Winner token mint (the token the user receives from mercy). Must not be the wallet address. */
    winnerMint: PublicKey;
    /** Loser token mint (the token the user held at resolution). Must not be the wallet address. */
    loserMint: PublicKey;
}

/**
 * Build a claim_mercy transaction (winner tokens only; loser tokens stay with user).
 * When beneficiary is omitted, authority is used as beneficiary (self-claim).
 */
export async function buildClaimMercyTx(
    program: Program<Apyx>,
    connection: Connection,
    params: ClaimMercyParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const programId = program.programId;
    const beneficiary = params.beneficiary ?? (params as { user?: PublicKey }).user ?? params.authority;
    const [bondingCurveLoserPDA] = deriveBondingCurvePda(params.loserMint, programId);
    const [mercyVaultPDA] = deriveMercyVaultPda(bondingCurveLoserPDA, params.duel, programId);
    const [configPDA] = deriveConfigPda(programId);

    const associatedBondingCurveLoser = getAssociatedTokenAddressSync(
        params.loserMint,
        bondingCurveLoserPDA,
        true,
        TOKEN_2022_PROGRAM_ID
    );
    const userLoserAta = getAssociatedTokenAddressSync(
        params.loserMint,
        beneficiary,
        false,
        TOKEN_2022_PROGRAM_ID
    );
    const userTokenAccount = getAssociatedTokenAddressSync(
        params.winnerMint,
        beneficiary,
        false,
        TOKEN_2022_PROGRAM_ID
    );

    const keys = [
        { pubkey: params.authority, isSigner: true, isWritable: true },
        { pubkey: beneficiary, isSigner: false, isWritable: false },
        { pubkey: params.winnerMint, isSigner: false, isWritable: false },
        { pubkey: params.loserMint, isSigner: false, isWritable: false },
        { pubkey: bondingCurveLoserPDA, isSigner: false, isWritable: true },
        { pubkey: params.duel, isSigner: false, isWritable: false },
        { pubkey: mercyVaultPDA, isSigner: false, isWritable: true },
        { pubkey: associatedBondingCurveLoser, isSigner: false, isWritable: true },
        { pubkey: userLoserAta, isSigner: false, isWritable: true },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: configPDA, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    const instruction = new TransactionInstruction({
        programId,
        keys,
        data: CLAIM_MERCY_DISCRIMINATOR,
    });

    const tx = new Transaction().add(instruction);
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = params.authority;

    const serializedTransaction = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serializedTransaction.toString("base64"),
        userWallet: beneficiary.toBase58(),
    };
}
