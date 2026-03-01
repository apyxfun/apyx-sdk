import { Transaction, PublicKey, Connection, Commitment, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult, SellParams } from "../types";
import { deriveBondingCurvePda, deriveConfigPda, deriveDuelPda, deriveMercyVaultPda } from "../helpers/pda";
import { mcapToBucket, currentWindow, deriveMatchKey } from "../helpers/matchmaking";
import { computeMarketCapLamports, computePostTradeMarketCap, computeSellSolOut } from "../helpers/duelResolution";
import { buildPumpSwapSellTx } from "./pumpSwapTrade";

export interface SellInstructionParams extends SellParams {
    /** User/payer public key */
    user: PublicKey;
}

/**
 * Build a sell (exact tokens in) transaction
 * Returns a base64 encoded transaction that needs to be signed by user
 */
export async function sell(
    program: Program<Apyx>,
    connection: Connection,
    params: SellInstructionParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const { user, mint, tokenAmount, minSolOut, poolIndex, poolCreator } = params;

    // Derive PDAs
    const [bondingCurvePDA] = deriveBondingCurvePda(mint, program.programId);
    const [configPDA] = deriveConfigPda(program.programId);

    // Fetch config to get matchmaking parameters
    const configAccount = await program.account.config.fetch(configPDA);

    // Fetch bonding curve to calculate bucket
    const bondingCurveAccount = await program.account.bondingCurveAccount.fetch(bondingCurvePDA);

    // Unified trading path:
    // - Graduated token -> PumpSwap swap
    // - Non-graduated token -> Apyx bonding curve instruction below
    if (bondingCurveAccount.complete) {
        return buildPumpSwapSellTx(
            program,
            connection,
            {
                user,
                mint,
                baseAmountIn: tokenAmount,
                minQuoteOut: minSolOut,
                poolIndex,
                poolCreator,
            },
            commitment,
        );
    }

    // Derive duel PDA from POST-trade mcap so it matches program's try_enter_duel (called after trade)
    const solOut = computeSellSolOut(
        bondingCurveAccount.virtualSolReserves,
        bondingCurveAccount.virtualTokenReserves,
        tokenAmount,
    );
    const postTradeMcap = computePostTradeMarketCap({
        virtualSolReserves: bondingCurveAccount.virtualSolReserves,
        realSolReserves: bondingCurveAccount.realSolReserves,
        virtualTokenReserves: bondingCurveAccount.virtualTokenReserves,
        tokenTotalSupply: bondingCurveAccount.tokenTotalSupply,
        isBuy: false,
        solDelta: solOut,
        tokenDelta: new BN(tokenAmount),
    });

    const bucket = mcapToBucket(BigInt(postTradeMcap.toString()), configAccount as any) ?? 0;

    // Calculate window and duel PDA using config values
    const slot = await connection.getSlot(commitment);
    const windowSize = Number(configAccount.windowSizeSlots.toString());
    const matchKeySpace = configAccount.matchKeySpace;
    const window = currentWindow(slot, windowSize);
    const matchKey = deriveMatchKey(mint, bucket, window, matchKeySpace);
    const [duelPDA] = deriveDuelPda(bucket, window, matchKey, program.programId);
    
    console.log("SDK Duel PDA Calculation (Sell):", {
        duelPDA: duelPDA.toBase58(),
        bucket,
        window,
        matchKey,
        mint: mint.toBase58(),
        slot,
        windowSize,
        matchKeySpace,
    });

    const associatedBondingCurve = getAssociatedTokenAddressSync(
        mint,
        bondingCurvePDA,
        true,
        TOKEN_2022_PROGRAM_ID
    );

    const associatedUser = getAssociatedTokenAddressSync(
        mint,
        user,
        false,
        TOKEN_2022_PROGRAM_ID
    );

    // Always include lastDuel account if it exists to enable self-healing
    // This is critical for self-healing when:
    // 1. PDAs don't match (bucket/window changed) - needed for verification
    // 2. PDAs match but status is stale (Pending but duel is Active) - enables self-healing
    let lastDuel: PublicKey | null = null;
    if (bondingCurveAccount.lastDuel && bondingCurveAccount.duelStatus) {
        // Always include lastDuel to enable self-healing, even if PDAs match
        // This ensures we can self-heal status mismatches (e.g., Pending -> Active)
        lastDuel = bondingCurveAccount.lastDuel;
    }

    // Self-healing fallback: if curve has lastDuel but duelStatus is stale, fetch actual duel and treat as active if duel is Active
    let hasActiveDuel =
        !!(bondingCurveAccount.lastDuel && bondingCurveAccount.duelStatus && "active" in bondingCurveAccount.duelStatus);
    if (!hasActiveDuel && bondingCurveAccount.lastDuel) {
        try {
            const duelAccount = await program.account.duel.fetch(bondingCurveAccount.lastDuel);
            const status = duelAccount.status ?? (duelAccount as any).roundStatus;
            if (status && typeof status === "object" && "active" in status) {
                hasActiveDuel = true;
            }
        } catch {
            // Duel account missing or invalid; keep hasActiveDuel false
        }
    }
    const duelAccountForInstruction = hasActiveDuel && lastDuel ? lastDuel : duelPDA;

    // Build accounts object
    const accounts: any = {
        user,
        mint,
        bondingCurve: bondingCurvePDA,
        associatedBondingCurve,
        associatedUser,
        config: configPDA,
        systemProgram: web3.SystemProgram.programId,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        duel: duelAccountForInstruction,
        lastDuel: lastDuel,
    };

    const remainingAccounts: web3.AccountMeta[] = [];

    if (hasActiveDuel) {
        const activeDuel = bondingCurveAccount.lastDuel as PublicKey;
        const duelAccount = await program.account.duel.fetch(activeDuel);

        if (!duelAccount.mintB) {
            throw new Error("Active duel missing mintB");
        }

        if (!duelAccount.mintA.equals(mint) && !duelAccount.mintB.equals(mint)) {
            throw new Error("Active duel does not include current mint");
        }

        const otherMint = duelAccount.mintA.equals(mint) ? duelAccount.mintB : duelAccount.mintA;
        const [otherBondingCurvePDA] = deriveBondingCurvePda(otherMint, program.programId);
        const otherAssociatedBondingCurve = getAssociatedTokenAddressSync(
            otherMint,
            otherBondingCurvePDA,
            true,
            TOKEN_2022_PROGRAM_ID
        );

        const otherBondingCurveAccount = await program.account.bondingCurveAccount.fetch(otherBondingCurvePDA);

        const solOut = computeSellSolOut(
            bondingCurveAccount.virtualSolReserves,
            bondingCurveAccount.virtualTokenReserves,
            tokenAmount,
        );

        const postMcap = computePostTradeMarketCap({
            virtualSolReserves: bondingCurveAccount.virtualSolReserves,
            realSolReserves: bondingCurveAccount.realSolReserves,
            virtualTokenReserves: bondingCurveAccount.virtualTokenReserves,
            tokenTotalSupply: bondingCurveAccount.tokenTotalSupply,
            isBuy: false,
            solDelta: solOut,
            tokenDelta: tokenAmount,
        });

        const otherMcap = computeMarketCapLamports({
            virtualSolReserves: otherBondingCurveAccount.virtualSolReserves,
            realSolReserves: otherBondingCurveAccount.realSolReserves,
            virtualTokenReserves: otherBondingCurveAccount.virtualTokenReserves,
            tokenTotalSupply: otherBondingCurveAccount.tokenTotalSupply,
        });

        const currentIsWinner = postMcap.gte(otherMcap);
        const loserBondingCurve = currentIsWinner ? otherBondingCurvePDA : bondingCurvePDA;
        const [mercyVaultPDA] = deriveMercyVaultPda(loserBondingCurve, activeDuel, program.programId);

        remainingAccounts.push(
            { pubkey: program.programId, isSigner: false, isWritable: false },
            { pubkey: otherMint, isSigner: false, isWritable: false },
            { pubkey: otherBondingCurvePDA, isSigner: false, isWritable: true },
            { pubkey: otherAssociatedBondingCurve, isSigner: false, isWritable: true },
            { pubkey: configAccount.protocolFeeVault, isSigner: false, isWritable: true },
            { pubkey: mercyVaultPDA, isSigner: false, isWritable: true },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        );
    }

    // Build instruction
    const instruction = await (program.methods as any)
        .sellExactTokensIn(tokenAmount, minSolOut)
        .accounts(accounts)
        .remainingAccounts(remainingAccounts)
        .instruction();

    // Build transaction
    const tx = new Transaction().add(instruction);

    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = user;

    const serializedTransaction = tx.serialize({ requireAllSignatures: false });

    return {
        transaction: serializedTransaction.toString("base64"),
        bondingCurve: bondingCurvePDA.toBase58(),
        userWallet: user.toBase58(),
    };
}
