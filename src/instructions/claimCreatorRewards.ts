import {
    Transaction,
    PublicKey,
    Connection,
    Commitment,
    TransactionInstruction,
} from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { TOKEN_2022_PROGRAM_ID, DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult } from "../types";
import {
    deriveBondingCurvePda,
    deriveCreatorVaultPda,
} from "../helpers/pda";

/** claim_creator_rewards instruction discriminator (first 8 bytes of sha256("global:claim_creator_rewards")) */
const CLAIM_CREATOR_REWARDS_DISCRIMINATOR = Buffer.from([14, 215, 177, 181, 221, 193, 125, 85]);

export interface ClaimCreatorRewardsParams {
    /** Creator wallet (signer); must match bonding_curve.creator. Receives the SOL. */
    creator: PublicKey;
    /** Token mint for the bonding curve whose creator vault to claim from. */
    mint: PublicKey;
}

/**
 * Build a claim_creator_rewards transaction. Only the bonding curve creator may sign and claim SOL from the vault.
 */
export async function buildClaimCreatorRewardsTx(
    program: Program<Apyx>,
    connection: Connection,
    params: ClaimCreatorRewardsParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const programId = program.programId;
    const [bondingCurvePDA] = deriveBondingCurvePda(params.mint, programId);
    const [creatorVaultPDA] = deriveCreatorVaultPda(bondingCurvePDA, programId);

    const keys = [
        { pubkey: params.creator, isSigner: true, isWritable: true },
        { pubkey: bondingCurvePDA, isSigner: false, isWritable: false },
        { pubkey: params.mint, isSigner: false, isWritable: false },
        { pubkey: creatorVaultPDA, isSigner: false, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const instruction = new TransactionInstruction({
        programId,
        keys,
        data: CLAIM_CREATOR_REWARDS_DISCRIMINATOR,
    });

    const tx = new Transaction().add(instruction);
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = params.creator;

    const serializedTransaction = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serializedTransaction.toString("base64"),
        userWallet: params.creator.toBase58(),
    };
}
