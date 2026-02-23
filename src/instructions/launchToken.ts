import { Transaction, TransactionInstruction, PublicKey, Keypair, Connection, Commitment, Finality } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, SEEDS, DEFAULT_COMMITMENT, DEFAULT_FINALITY } from "../constants";
import { TransactionResult, LaunchTokenParams } from "../types";
import { deriveBondingCurvePda, deriveMintAuthorityPda, deriveConfigPda } from "../helpers/pda";

export interface LaunchTokenInstructionParams extends LaunchTokenParams {
    /** User/payer public key */
    user: PublicKey;
}

export interface LaunchTokenInstructionResult {
    instruction: TransactionInstruction;
    mint: PublicKey;
    bondingCurve: string;
    userWallet: string;
}

/**
 * Build only the launch_token instruction (no transaction, no blockhash).
 * Use this to build one atomic transaction with multiple instructions.
 */
export async function getLaunchTokenInstruction(
    program: Program<Apyx>,
    params: LaunchTokenInstructionParams,
): Promise<LaunchTokenInstructionResult> {
    const { user, mintKeypair, name, symbol, uri, creator } = params;
    const mint = mintKeypair.publicKey;

    const [bondingCurvePDA] = deriveBondingCurvePda(mint, program.programId);
    const [mintAuthorityPDA] = deriveMintAuthorityPda(program.programId);
    const [configPDA] = deriveConfigPda(program.programId);

    const associatedBondingCurve = getAssociatedTokenAddressSync(
        mint,
        bondingCurvePDA,
        true,
        TOKEN_2022_PROGRAM_ID
    );

    const instruction = await (program.methods as any)
        .launchToken(name, symbol, uri, creator)
        .accounts({
            user,
            mint,
            mintAuthority: mintAuthorityPDA,
            bondingCurve: bondingCurvePDA,
            associatedBondingCurve,
            config: configPDA,
            systemProgram: web3.SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY,
            token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();

    return {
        instruction,
        mint,
        bondingCurve: bondingCurvePDA.toBase58(),
        userWallet: user.toBase58(),
    };
}

/**
 * Build a launch token transaction
 * Returns a base64 encoded transaction that needs to be signed by user and mint keypair
 */
export async function launchToken(
    program: Program<Apyx>,
    connection: Connection,
    params: LaunchTokenInstructionParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const { instruction, mint, bondingCurve, userWallet } = await getLaunchTokenInstruction(program, params);
    const user = params.user;

    const tx = new Transaction().add(instruction);
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = user;
    tx.partialSign(params.mintKeypair);

    const serializedTransaction = tx.serialize({ requireAllSignatures: false });
    return {
        transaction: serializedTransaction.toString("base64"),
        mint: mint.toBase58(),
        bondingCurve,
        userWallet,
    };
}
