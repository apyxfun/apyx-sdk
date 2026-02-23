import { Program, BN } from "@coral-xyz/anchor";
import { Commitment, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { OnlinePumpAmmSdk, PumpAmmSdk, poolPda } from "@pump-fun/pump-swap-sdk";
import { Apyx } from "../idl";
import { DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult } from "../types";
import { deriveBondingCurvePda, deriveConfigPda } from "../helpers/pda";

const DEFAULT_PUMP_POOL_INDEX = 0;

type PoolRoutingParams = {
    poolIndex?: number;
    poolCreator?: PublicKey;
};

function toPublicKey(value: unknown): PublicKey {
    if (value instanceof PublicKey) return value;
    return new PublicKey(value as string);
}

async function derivePumpPoolKey(
    program: Program<Apyx>,
    mint: PublicKey,
    options: PoolRoutingParams,
): Promise<PublicKey> {
    const poolIndex = options.poolIndex ?? DEFAULT_PUMP_POOL_INDEX;
    let poolCreator = options.poolCreator;

    if (!poolCreator) {
        const [configPDA] = deriveConfigPda(program.programId);
        const configAccount = await program.account.config.fetch(configPDA);
        const rawCreator =
            (configAccount as any).delegatedResolveAuthority ??
            (configAccount as any).delegated_resolve_authority;

        if (!rawCreator) {
            throw new Error("Config missing delegated resolve authority for PumpSwap pool derivation");
        }
        poolCreator = toPublicKey(rawCreator);
    }

    return poolPda(poolIndex, poolCreator, mint, NATIVE_MINT);
}

export async function buildPumpSwapBuyTx(
    program: Program<Apyx>,
    connection: Connection,
    params: {
        user: PublicKey;
        mint: PublicKey;
        maxQuoteIn: BN;
        minBaseOut: BN;
        poolIndex?: number;
        poolCreator?: PublicKey;
    },
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const poolKey = await derivePumpPoolKey(program, params.mint, {
        poolIndex: params.poolIndex,
        poolCreator: params.poolCreator,
    });

    const onlinePumpAmmSdk = new OnlinePumpAmmSdk(connection);
    const pumpAmmSdk = new PumpAmmSdk();

    const swapSolanaState = await onlinePumpAmmSdk.swapSolanaState(
        poolKey,
        params.user,
    );
    const instructions = await pumpAmmSdk.buyInstructions(
        swapSolanaState,
        new BN(params.minBaseOut.toString()),
        new BN(params.maxQuoteIn.toString()),
    );

    const tx = new Transaction().add(...instructions);
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = params.user;

    const [bondingCurvePDA] = deriveBondingCurvePda(params.mint, program.programId);
    const serialized = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serialized.toString("base64"),
        bondingCurve: bondingCurvePDA.toBase58(),
        userWallet: params.user.toBase58(),
    };
}

export async function buildPumpSwapSellTx(
    program: Program<Apyx>,
    connection: Connection,
    params: {
        user: PublicKey;
        mint: PublicKey;
        baseAmountIn: BN;
        minQuoteOut: BN;
        poolIndex?: number;
        poolCreator?: PublicKey;
    },
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const poolKey = await derivePumpPoolKey(program, params.mint, {
        poolIndex: params.poolIndex,
        poolCreator: params.poolCreator,
    });

    const onlinePumpAmmSdk = new OnlinePumpAmmSdk(connection);
    const pumpAmmSdk = new PumpAmmSdk();

    const swapSolanaState = await onlinePumpAmmSdk.swapSolanaState(
        poolKey,
        params.user,
    );
    const instructions = await pumpAmmSdk.sellInstructions(
        swapSolanaState,
        new BN(params.baseAmountIn.toString()),
        new BN(params.minQuoteOut.toString()),
    );

    const tx = new Transaction().add(...instructions);
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = params.user;

    const [bondingCurvePDA] = deriveBondingCurvePda(params.mint, program.programId);
    const serialized = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serialized.toString("base64"),
        bondingCurve: bondingCurvePDA.toBase58(),
        userWallet: params.user.toBase58(),
    };
}
