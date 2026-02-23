import { Commitment, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult } from "../types";
import { buildResolveDuelTx } from "./resolveDuel";
import { buildMigrateTx } from "./migrate";

export interface ResolveAndMigrateParams {
    /** Signer: must equal config.delegated_resolve_authority. */
    authority: PublicKey;
    /** Duel winner mint for resolve_duel. */
    winnerMint: PublicKey;
    /** Duel loser mint for resolve_duel. */
    loserMint: PublicKey;
    /** Duel PDA. */
    duel: PublicKey;
    /** Mint to migrate after resolution (same atomic transaction). */
    mint: PublicKey;
    /** Optional PumpSwap pool index override (default 0). */
    poolIndex?: number;
    /** Optional PumpSwap coin_creator override. Defaults to bonding_curve.creator. */
    coinCreator?: PublicKey | null;
}

/**
 * Build one atomic transaction:
 * 1) resolve_duel
 * 2) migrate
 * 3) PumpSwap create_pool instructions (appended by migrate builder)
 */
export async function buildResolveAndMigrateTx(
    program: Program<Apyx>,
    connection: Connection,
    params: ResolveAndMigrateParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const resolveTxResult = await buildResolveDuelTx(
        program,
        connection,
        {
            authority: params.authority,
            winnerMint: params.winnerMint,
            loserMint: params.loserMint,
            duel: params.duel,
        },
        commitment,
    );

    const migrateTxResult = await buildMigrateTx(
        program,
        connection,
        {
            authority: params.authority,
            mint: params.mint,
            poolIndex: params.poolIndex,
            coinCreator: params.coinCreator,
        },
        commitment,
    );

    const resolveTx = Transaction.from(Buffer.from(resolveTxResult.transaction, "base64"));
    const migrateTx = Transaction.from(Buffer.from(migrateTxResult.transaction, "base64"));

    const tx = new Transaction().add(...resolveTx.instructions, ...migrateTx.instructions);
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = params.authority;

    const serializedTransaction = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serializedTransaction.toString("base64"),
        userWallet: params.authority.toBase58(),
    };
}

