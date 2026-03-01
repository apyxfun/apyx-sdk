import { Transaction, TransactionInstruction, PublicKey, Connection, Commitment, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { Apyx } from "../idl";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, DEFAULT_COMMITMENT } from "../constants";
import { TransactionResult, BuyParams } from "../types";
import { deriveBondingCurvePda, deriveConfigPda, deriveCreatorVaultPda, deriveDuelPda } from "../helpers/pda";
import { mcapToBucket, currentWindow, deriveMatchKey } from "../helpers/matchmaking";
import { computeBuyDeltas, computePostTradeMarketCap } from "../helpers/duelResolution";
import { buildPumpSwapBuyTx } from "./pumpSwapTrade";

export interface BuyInstructionParams extends BuyParams {
    /** User/payer public key */
    user: PublicKey;
}

/**
 * Build a buy (exact SOL in) transaction
 * Returns a base64 encoded transaction that needs to be signed by user
 */
export async function buy(
    program: Program<Apyx>,
    connection: Connection,
    params: BuyInstructionParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<TransactionResult> {
    const { user, mint, solAmount, minTokensOut, poolIndex, poolCreator } = params;

    // Derive PDAs
    const [bondingCurvePDA] = deriveBondingCurvePda(mint, program.programId);
    const [configPDA] = deriveConfigPda(program.programId);
    const [creatorVaultPDA] = deriveCreatorVaultPda(bondingCurvePDA, program.programId);

    // Derive associated token accounts
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

    // Fetch config to get protocol fee vault and matchmaking parameters
    const configAccount = await program.account.config.fetch(configPDA);
    const protocolFeeVault = configAccount.protocolFeeVault;

    // Try to fetch bonding curve to calculate bucket
    // If it doesn't exist yet (e.g., for new token launches), use initial reserves from config
    let bondingCurveAccount;
    let lastDuel: PublicKey | null = null;

    try {
        bondingCurveAccount = await program.account.bondingCurveAccount.fetch(bondingCurvePDA);
    } catch (error) {
        bondingCurveAccount = null;
    }

    // Unified trading path:
    // - Graduated token -> PumpSwap swap
    // - Non-graduated token -> Apyx bonding curve instruction below
    if (bondingCurveAccount?.complete) {
        return buildPumpSwapBuyTx(
            program,
            connection,
            {
                user,
                mint,
                maxQuoteIn: solAmount,
                minBaseOut: minTokensOut,
                poolIndex,
                poolCreator,
            },
            commitment,
        );
    }

    // Derive duel PDA from POST-trade mcap so it matches program's try_enter_duel (called after trade).
    // For launch+buy: use initial reserves + this buy to compute post-trade mcap.
    let postTradeMcap: BN;
    if (bondingCurveAccount) {
        const { adjustedNetSol, tokensOut } = computeBuyDeltas({
            spendableSolIn: solAmount,
            virtualSolReserves: bondingCurveAccount.virtualSolReserves,
            virtualTokenReserves: bondingCurveAccount.virtualTokenReserves,
            protocolFeeBps: configAccount.protocolFeeBps,
            creatorFeeBps: configAccount.creatorFeeBps,
        });
        postTradeMcap = computePostTradeMarketCap({
            virtualSolReserves: bondingCurveAccount.virtualSolReserves,
            realSolReserves: bondingCurveAccount.realSolReserves,
            virtualTokenReserves: bondingCurveAccount.virtualTokenReserves,
            tokenTotalSupply: bondingCurveAccount.tokenTotalSupply,
            isBuy: true,
            solDelta: adjustedNetSol,
            tokenDelta: tokensOut,
        });
    } else {
        // Launch + buy in same tx: initial state has realSolReserves=0; compute post-trade mcap after this buy
        const initialVirtualSol = configAccount.initialVirtualSolReserves;
        const initialVirtualToken = configAccount.initialVirtualTokenReserves;
        const initialRealSol = new BN(0);
        const tokenTotalSupply = configAccount.totalSupply;
        const { adjustedNetSol, tokensOut } = computeBuyDeltas({
            spendableSolIn: solAmount,
            virtualSolReserves: initialVirtualSol,
            virtualTokenReserves: initialVirtualToken,
            protocolFeeBps: configAccount.protocolFeeBps,
            creatorFeeBps: configAccount.creatorFeeBps,
        });
        postTradeMcap = computePostTradeMarketCap({
            virtualSolReserves: initialVirtualSol,
            realSolReserves: initialRealSol,
            virtualTokenReserves: initialVirtualToken,
            tokenTotalSupply,
            isBuy: true,
            solDelta: adjustedNetSol,
            tokenDelta: tokensOut,
        });
    }

    const bucket = mcapToBucket(BigInt(postTradeMcap.toString()), configAccount as any) ?? 0;

    // Calculate window and duel PDA using config values
    const slot = await connection.getSlot(commitment);
    const windowSize = Number(configAccount.windowSizeSlots.toString());
    const matchKeySpace = configAccount.matchKeySpace;
    const window = currentWindow(slot, windowSize);
    const matchKey = deriveMatchKey(mint, bucket, window, matchKeySpace);
    const [duelPDA] = deriveDuelPda(bucket, window, matchKey, program.programId);
    
    console.log("SDK Duel PDA Calculation:", {
        duelPDA: duelPDA.toBase58(),
        bucket,
        window,
        matchKey,
        mint: mint.toBase58(),
        slot,
        windowSize,
        matchKeySpace,
    });

    // Always include lastDuel account if it exists to enable self-healing
    // This is critical for self-healing when:
    // 1. PDAs don't match (bucket/window changed) - needed for verification
    // 2. PDAs match but status is stale (Pending but duel is Active) - enables self-healing
    // Only check if we successfully fetched the bonding curve account
    if (bondingCurveAccount && bondingCurveAccount.lastDuel && bondingCurveAccount.duelStatus) {
        // Always include lastDuel to enable self-healing, even if PDAs match
        // This ensures we can self-heal status mismatches (e.g., Pending -> Active)
        lastDuel = bondingCurveAccount.lastDuel;
    }

    // When token is in an active duel, pass the actual duel account (lastDuel), not the derived PDA.
    // The program validates that duel matches bonding_curve.last_duel when duel_status is Active.
    // Self-healing fallback: if curve has lastDuel but duelStatus is stale (e.g. Pending), fetch actual duel and treat as active if duel is Active.
    let hasActiveDuel =
        !!(
            bondingCurveAccount &&
            bondingCurveAccount.lastDuel &&
            bondingCurveAccount.duelStatus &&
            typeof bondingCurveAccount.duelStatus === "object" &&
            "active" in bondingCurveAccount.duelStatus
        );
    if (!hasActiveDuel && bondingCurveAccount?.lastDuel) {
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
        creatorVault: creatorVaultPDA,
        config: configPDA,
        protocolFeeVault,
        duel: duelAccountForInstruction,
        systemProgram: web3.SystemProgram.programId,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        lastDuel: lastDuel,
    };

    // Resolve and migrate are separate instructions (post-trade service); buy only needs duel/lastDuel for try_enter_duel.
    const remainingAccounts: web3.AccountMeta[] = [];

    // Build instruction
    const instruction = await (program.methods as any)
        .buyExactSolIn(solAmount, minTokensOut)
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

export interface BuyInstructionResult {
    instruction: TransactionInstruction;
    bondingCurve: string;
    userWallet: string;
}

/**
 * Build only the buy (bonding curve) instruction (no transaction, no blockhash).
 * Use for one atomic transaction with multiple instructions (e.g. launch + buy).
 * Throws for graduated tokens; use buy() for those.
 */
export async function getBuyInstruction(
    program: Program<Apyx>,
    connection: Connection,
    params: BuyInstructionParams,
    commitment: Commitment = DEFAULT_COMMITMENT,
): Promise<BuyInstructionResult> {
    const { user, mint, solAmount, minTokensOut, poolIndex, poolCreator } = params;

    const [bondingCurvePDA] = deriveBondingCurvePda(mint, program.programId);
    const [configPDA] = deriveConfigPda(program.programId);
    const [creatorVaultPDA] = deriveCreatorVaultPda(bondingCurvePDA, program.programId);

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

    const configAccount = await program.account.config.fetch(configPDA);
    const protocolFeeVault = configAccount.protocolFeeVault;

    let bondingCurveAccount;
    let lastDuel: PublicKey | null = null;

    try {
        bondingCurveAccount = await program.account.bondingCurveAccount.fetch(bondingCurvePDA);
    } catch {
        bondingCurveAccount = null;
    }

    if (bondingCurveAccount?.complete) {
        throw new Error("getBuyInstruction is for bonding curve only; use buy() for graduated tokens");
    }

    let postTradeMcap: BN;
    if (bondingCurveAccount) {
        const { adjustedNetSol, tokensOut } = computeBuyDeltas({
            spendableSolIn: solAmount,
            virtualSolReserves: bondingCurveAccount.virtualSolReserves,
            virtualTokenReserves: bondingCurveAccount.virtualTokenReserves,
            protocolFeeBps: configAccount.protocolFeeBps,
            creatorFeeBps: configAccount.creatorFeeBps,
        });
        postTradeMcap = computePostTradeMarketCap({
            virtualSolReserves: bondingCurveAccount.virtualSolReserves,
            realSolReserves: bondingCurveAccount.realSolReserves,
            virtualTokenReserves: bondingCurveAccount.virtualTokenReserves,
            tokenTotalSupply: bondingCurveAccount.tokenTotalSupply,
            isBuy: true,
            solDelta: adjustedNetSol,
            tokenDelta: tokensOut,
        });
    } else {
        const initialVirtualSol = configAccount.initialVirtualSolReserves;
        const initialVirtualToken = configAccount.initialVirtualTokenReserves;
        const initialRealSol = new BN(0);
        const tokenTotalSupply = configAccount.totalSupply;
        const { adjustedNetSol, tokensOut } = computeBuyDeltas({
            spendableSolIn: solAmount,
            virtualSolReserves: initialVirtualSol,
            virtualTokenReserves: initialVirtualToken,
            protocolFeeBps: configAccount.protocolFeeBps,
            creatorFeeBps: configAccount.creatorFeeBps,
        });
        postTradeMcap = computePostTradeMarketCap({
            virtualSolReserves: initialVirtualSol,
            realSolReserves: initialRealSol,
            virtualTokenReserves: initialVirtualToken,
            tokenTotalSupply,
            isBuy: true,
            solDelta: adjustedNetSol,
            tokenDelta: tokensOut,
        });
    }

    const bucket = mcapToBucket(BigInt(postTradeMcap.toString()), configAccount as any) ?? 0;
    const slot = await connection.getSlot(commitment);
    const windowSize = Number(configAccount.windowSizeSlots.toString());
    const matchKeySpace = configAccount.matchKeySpace;
    const window = currentWindow(slot, windowSize);
    const matchKey = deriveMatchKey(mint, bucket, window, matchKeySpace);
    const [duelPDA] = deriveDuelPda(bucket, window, matchKey, program.programId);

    if (bondingCurveAccount?.lastDuel && bondingCurveAccount?.duelStatus) {
        lastDuel = bondingCurveAccount.lastDuel;
    }
    let hasActiveDuel = !!(
        bondingCurveAccount &&
        bondingCurveAccount.lastDuel &&
        bondingCurveAccount.duelStatus &&
        typeof bondingCurveAccount.duelStatus === "object" &&
        "active" in bondingCurveAccount.duelStatus
    );
    if (!hasActiveDuel && bondingCurveAccount?.lastDuel) {
        try {
            const duelAccount = await program.account.duel.fetch(bondingCurveAccount.lastDuel);
            const status = duelAccount.status ?? (duelAccount as any).roundStatus;
            if (status && typeof status === "object" && "active" in status) {
                hasActiveDuel = true;
            }
        } catch {
            // ignore
        }
    }
    const duelAccountForInstruction = hasActiveDuel && lastDuel ? lastDuel : duelPDA;

    const accounts: any = {
        user,
        mint,
        bondingCurve: bondingCurvePDA,
        associatedBondingCurve,
        associatedUser,
        creatorVault: creatorVaultPDA,
        config: configPDA,
        protocolFeeVault,
        duel: duelAccountForInstruction,
        systemProgram: web3.SystemProgram.programId,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        lastDuel: lastDuel,
    };
    const remainingAccounts: web3.AccountMeta[] = [];

    const instruction = await (program.methods as any)
        .buyExactSolIn(solAmount, minTokensOut)
        .accounts(accounts)
        .remainingAccounts(remainingAccounts)
        .instruction();

    return {
        instruction,
        bondingCurve: bondingCurvePDA.toBase58(),
        userWallet: user.toBase58(),
    };
}
