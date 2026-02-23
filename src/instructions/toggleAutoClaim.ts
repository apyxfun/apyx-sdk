import {
    Transaction,
    PublicKey,
    Connection,
    Commitment,
    TransactionInstruction,
} from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult } from "../types";
import { deriveUserSettingsPda } from "../helpers/pda";
import { SystemProgram } from "@solana/web3.js";

/** toggle_auto_claim instruction discriminator */
const TOGGLE_AUTO_CLAIM_DISCRIMINATOR = Buffer.from([44, 64, 204, 46, 239, 114, 158, 68]);

export interface ToggleAutoClaimParams {
    /** Signer; their user_settings PDA is toggled. */
    authority: PublicKey;
}

/**
 * Build a toggle_auto_claim transaction (flip auto_claim_mercy for the wallet).
 */
export async function buildToggleAutoClaimTx(
    program: Program<Apyx>,
    connection: Connection,
    params: ToggleAutoClaimParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const programId = program.programId;
    const [userSettingsPDA] = deriveUserSettingsPda(params.authority, programId);

    const keys = [
        { pubkey: params.authority, isSigner: true, isWritable: true },
        { pubkey: userSettingsPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    const instruction = new TransactionInstruction({
        programId,
        keys,
        data: TOGGLE_AUTO_CLAIM_DISCRIMINATOR,
    });

    const tx = new Transaction().add(instruction);
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = params.authority;

    const serializedTransaction = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serializedTransaction.toString("base64"),
        userWallet: params.authority.toBase58(),
    };
}
