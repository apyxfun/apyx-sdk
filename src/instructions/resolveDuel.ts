import { Transaction, PublicKey, Connection, Commitment, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { TOKEN_2022_PROGRAM_ID, DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult } from "../types";
import {
    deriveConfigPda,
    deriveBondingCurvePda,
    deriveMercyVaultPda,
} from "../helpers/pda";

export interface ResolveDuelParams {
    /** Signer: must equal config.delegated_resolve_authority (e.g. post-trade service keypair). */
    authority: PublicKey;
    winnerMint: PublicKey;
    loserMint: PublicKey;
    duel: PublicKey;
}

/**
 * Build a resolve_duel transaction. Caller signs with the delegated_resolve_authority keypair and sends.
 */
export async function buildResolveDuelTx(
    program: Program<Apyx>,
    connection: Connection,
    params: ResolveDuelParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const [configPDA] = deriveConfigPda(program.programId);
    const configAccount = await program.account.config.fetch(configPDA);

    const [bondingCurveWinnerPDA] = deriveBondingCurvePda(params.winnerMint, program.programId);
    const [bondingCurveLoserPDA] = deriveBondingCurvePda(params.loserMint, program.programId);
    const [mercyVaultPDA] = deriveMercyVaultPda(bondingCurveLoserPDA, params.duel, program.programId);

    const associatedBondingCurveWinner = getAssociatedTokenAddressSync(
        params.winnerMint,
        bondingCurveWinnerPDA,
        true,
        TOKEN_2022_PROGRAM_ID
    );
    const associatedBondingCurveLoser = getAssociatedTokenAddressSync(
        params.loserMint,
        bondingCurveLoserPDA,
        true,
        TOKEN_2022_PROGRAM_ID
    );

    const instruction = await (program.methods as any)
        .resolveDuel()
        .accounts({
            authority: params.authority,
            winnerMint: params.winnerMint,
            loserMint: params.loserMint,
            bondingCurveWinner: bondingCurveWinnerPDA,
            bondingCurveLoser: bondingCurveLoserPDA,
            duel: params.duel,
            config: configPDA,
            protocolFeeVault: configAccount.protocolFeeVault,
            associatedBondingCurveWinner,
            associatedBondingCurveLoser,
            mercyVault: mercyVaultPDA,
            token2022Program: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

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
