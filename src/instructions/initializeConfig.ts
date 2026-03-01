import { Transaction, PublicKey, Connection, Commitment, SystemProgram } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult } from "../types";
import { deriveConfigPda } from "../helpers/pda";

export interface InitializeConfigParams {
    protocolFeeBps: number;
    creatorFeeBps: number;
    protocolFeeVault: PublicKey;
    targetMcapGrowthBps: number;
    /** Max allowed gap between mcap buckets in bps (e.g. 11000 = 10% gap per bucket). Default 11000. */
    mcapBucketGapBps?: number;
    graduateTokens: boolean;
    graduationFeeLamports: BN;
    initialVirtualSolReserves: BN;
    initialVirtualTokenReserves: BN;
    initialRealTokenReserves: BN;
    totalSupply: BN;
    windowSizeSlots: BN;
    matchKeySpace: number;
    cooldownSlots: BN;
    delegatedClaimAuthority: PublicKey;
    delegatedResolveAuthority: PublicKey;
    /** Mercy discount multiplier in bps (e.g. 10000 = 1.0, 11000 = 1.1). Default 10000. */
    mercyDiscountMultiplierBps?: number;
}

/**
 * Build an initialize config transaction
 */
export async function initializeConfig(
    program: Program<Apyx>,
    connection: Connection,
    admin: PublicKey,
    params: InitializeConfigParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult & { config_id: string }> {
    const [configPDA] = deriveConfigPda(program.programId);

    const instruction = await (program.methods as any)
        .configInit(
            params.protocolFeeBps,
            params.creatorFeeBps,
            params.protocolFeeVault,
            params.targetMcapGrowthBps,
            params.mcapBucketGapBps ?? 11000,
            params.graduateTokens,
            params.graduationFeeLamports,
            params.initialVirtualSolReserves,
            params.initialVirtualTokenReserves,
            params.initialRealTokenReserves,
            params.totalSupply,
            params.windowSizeSlots,
            params.matchKeySpace,
            params.cooldownSlots,
            params.delegatedClaimAuthority,
            params.delegatedResolveAuthority,
            params.mercyDiscountMultiplierBps ?? 10000
        )
        .accounts({
            admin,
            config: configPDA,
            systemProgram: SystemProgram.programId,
        })
        .instruction();

    const tx = new Transaction().add(instruction);
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = admin;

    const serializedTransaction = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serializedTransaction.toString("base64"),
        config_id: configPDA.toBase58(),
        userWallet: admin.toBase58(),
    };
}
