import { Connection, PublicKey, Commitment, Finality } from "@solana/web3.js";
import { Program, Provider, BN } from "@coral-xyz/anchor";
import { Apyx, IDL } from "./idl";
import { PROGRAM_ID, DEFAULT_COMMITMENT, DEFAULT_FINALITY } from "./constants";
import { LaunchTokenParams, BuyParams, SellParams, TransactionResult, TokenInfo, DuelData } from "./types";
import { launchToken as launchTokenInstruction, getLaunchTokenInstruction as getLaunchTokenInstructionFn } from "./instructions/launchToken";
import { buy as buyInstruction, getBuyInstruction as getBuyInstructionFn } from "./instructions/buy";
import { sell as sellInstruction } from "./instructions/sell";
import { initializeConfig as initializeConfigInstruction, InitializeConfigParams } from "./instructions/initializeConfig";
import { buildClaimMercyTx as buildClaimMercyTxInstruction, ClaimMercyParams } from "./instructions/claimMercy";
import { buildClaimCreatorRewardsTx as buildClaimCreatorRewardsTxInstruction, ClaimCreatorRewardsParams } from "./instructions/claimCreatorRewards";
import { buildToggleAutoClaimTx as buildToggleAutoClaimTxInstruction, ToggleAutoClaimParams } from "./instructions/toggleAutoClaim";
import { buildResolveDuelTx as buildResolveDuelTxInstruction, ResolveDuelParams } from "./instructions/resolveDuel";
import { buildMigrateTx as buildMigrateTxInstruction, MigrateParams } from "./instructions/migrate";
import { buildResolveAndMigrateTx as buildResolveAndMigrateTxInstruction, ResolveAndMigrateParams } from "./instructions/resolveAndMigrate";
import { BondingCurveAccount } from "./accounts/bondingCurve";
import { ConfigAccount } from "./accounts/config";
import { DuelAccount } from "./accounts/duel";
import { deriveBondingCurvePda, deriveConfigPda, deriveCreatorVaultPda } from "./helpers/pda";
import { getTokenPrice, getTokenPriceInSol, getMarketCap } from "./helpers/quotes";
import { LaunchTokenEvent, TradeEvent, DuelMatchedEvent, DuelCreatedEvent, DuelPairingFailedEvent, DuelResolvedEvent, ClaimMercyEvent, TokenGraduatedEvent } from "./events/types";
import { toLaunchTokenEvent, toTradeEvent, toDuelMatchedEvent, toDuelCreatedEvent, toDuelPairingFailedEvent, toDuelResolvedEvent, toClaimMercyEvent, toTokenGraduatedEvent } from "./events/parsers";

export interface ApyxClientConfig {
    connection: Connection;
    programId?: PublicKey;
}

/**
 * ApyxClient - Main SDK client for interacting with the Apyx program
 */
export class ApyxClient {
    public readonly program: Program<Apyx>;
    public readonly connection: Connection;
    public readonly programId: PublicKey;

    constructor(provider: Provider, programId: PublicKey = PROGRAM_ID) {
        this.program = new Program<Apyx>(IDL as Apyx, provider);
        this.connection = provider.connection;
        this.programId = programId;
    }

    /**
     * Create a client from a connection (read-only operations)
     */
    static fromConnection(connection: Connection, programId: PublicKey = PROGRAM_ID): ApyxClient {
        // Create a minimal provider for read-only access
        const provider = {
            connection,
            publicKey: null,
        } as unknown as Provider;

        return new ApyxClient(provider, programId);
    }

    // ============================================================================
    // Instructions
    // ============================================================================

    /**
     * Launch a new token with a bonding curve
     */
    async launchToken(
        user: PublicKey,
        params: LaunchTokenParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return launchTokenInstruction(
            this.program,
            this.connection,
            { ...params, user },
            commitment,
        );
    }

    /**
     * Instruction only (no tx, no blockhash). Use for one atomic tx with multiple instructions.
     */
    async getLaunchTokenInstruction(
        user: PublicKey,
        params: LaunchTokenParams,
    ) {
        return getLaunchTokenInstructionFn(this.program, { ...params, user });
    }

    /**
     * Instruction only for bonding curve buy (no tx, no blockhash). Throws for graduated tokens.
     */
    async getBuyInstruction(
        user: PublicKey,
        params: BuyParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ) {
        return getBuyInstructionFn(
            this.program,
            this.connection,
            { ...params, user },
            commitment,
        );
    }

    /**
     * Buy tokens with SOL
     */
    async buy(
        user: PublicKey,
        params: BuyParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return buyInstruction(
            this.program,
            this.connection,
            { ...params, user },
            commitment,
        );
    }

    /**
     * Sell tokens for SOL
     */
    async sell(
        user: PublicKey,
        params: SellParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return sellInstruction(
            this.program,
            this.connection,
            { ...params, user },
            commitment,
        );
    }

    /**
     * Initialize program configuration
     */
    async initializeConfig(
        admin: PublicKey,
        params: InitializeConfigParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult & { config_id: string }> {
        return initializeConfigInstruction(
            this.program,
            this.connection,
            admin,
            params,
            commitment,
        );
    }

    /**
     * Build claim_mercy transaction (winner tokens only; optional beneficiary for delegated claim)
     */
    async buildClaimMercyTx(
        params: ClaimMercyParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return buildClaimMercyTxInstruction(
            this.program,
            this.connection,
            params,
            commitment,
        );
    }

    /**
     * Build claim_creator_rewards transaction. Only the bonding curve creator may sign and claim SOL from the vault.
     */
    async buildClaimCreatorRewardsTx(
        params: ClaimCreatorRewardsParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return buildClaimCreatorRewardsTxInstruction(
            this.program,
            this.connection,
            params,
            commitment,
        );
    }

    /**
     * Build toggle_auto_claim transaction (flip auto_claim_mercy for the wallet)
     */
    async buildToggleAutoClaimTx(
        params: ToggleAutoClaimParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return buildToggleAutoClaimTxInstruction(
            this.program,
            this.connection,
            params,
            commitment,
        );
    }

    /**
     * Build resolve_duel transaction (callable only by config.delegated_resolve_authority)
     */
    async buildResolveDuelTx(
        params: ResolveDuelParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return buildResolveDuelTxInstruction(
            this.program,
            this.connection,
            params,
            commitment,
        );
    }

    /**
     * Build migrate transaction (graduation to PumpSwap; callable only by config.delegated_resolve_authority)
     */
    async buildMigrateTx(
        params: MigrateParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return buildMigrateTxInstruction(
            this.program,
            this.connection,
            params,
            commitment,
        );
    }

    /**
     * Build one atomic resolve_duel + migrate (+ createPool) transaction.
     */
    async buildResolveAndMigrateTx(
        params: ResolveAndMigrateParams,
        commitment: Commitment = DEFAULT_COMMITMENT,
    ): Promise<TransactionResult> {
        return buildResolveAndMigrateTxInstruction(
            this.program,
            this.connection,
            params,
            commitment,
        );
    }

    // ============================================================================
    // Account Fetchers
    // ============================================================================

    /**
     * Get bonding curve account for a token mint
     */
    async getBondingCurve(mint: PublicKey): Promise<BondingCurveAccount & { address: PublicKey }> {
        const [bondingCurvePDA] = deriveBondingCurvePda(mint, this.programId);
        const account = await this.program.account.bondingCurveAccount.fetch(bondingCurvePDA);

        return new BondingCurveAccount({
            ...account,
            virtualSolReserves: account.virtualSolReserves,
            virtualTokenReserves: account.virtualTokenReserves,
            realSolReserves: account.realSolReserves,
            realTokenReserves: account.realTokenReserves,
            tokenTotalSupply: account.tokenTotalSupply,
            roundWins: account.roundWins,
            lastDuel: account.lastDuel || null,
            duelStatus: account.duelStatus || null,
            address: bondingCurvePDA,
        }) as BondingCurveAccount & { address: PublicKey };
    }

    /**
     * Get program configuration
     */
    async getConfig(): Promise<ConfigAccount> {
        const [configPDA] = deriveConfigPda(this.programId);
        const account = await this.program.account.config.fetch(configPDA);

        const delegatedAuthority = (account as any).delegatedClaimAuthority ?? (account as any).delegated_claim_authority;
        const delegatedResolveAuthorityRaw = (account as any).delegatedResolveAuthority ?? (account as any).delegated_resolve_authority;
        const raw = account as any;
        return new ConfigAccount({
            admin: account.admin,
            protocolFeeVault: account.protocolFeeVault,
            protocolFeeBps: account.protocolFeeBps,
            creatorFeeBps: account.creatorFeeBps,
            targetMcapGrowthBps: raw.targetMcapGrowthBps ?? raw.target_mcap_growth_bps ?? 11000,
            graduateTokens: raw.graduateTokens ?? raw.graduate_tokens ?? false,
            graduationFeeLamports: raw.graduationFeeLamports ?? raw.graduation_fee_lamports ?? new BN(6_000_000_000),
            initialVirtualSolReserves: account.initialVirtualSolReserves,
            initialVirtualTokenReserves: account.initialVirtualTokenReserves,
            initialRealTokenReserves: account.initialRealTokenReserves,
            totalSupply: account.totalSupply,
            windowSizeSlots: account.windowSizeSlots,
            matchKeySpace: account.matchKeySpace,
            cooldownSlots: account.cooldownSlots,
            delegatedClaimAuthority: delegatedAuthority ? new PublicKey(delegatedAuthority) : new PublicKey('11111111111111111111111111111111'),
            delegatedResolveAuthority: delegatedResolveAuthorityRaw ? new PublicKey(delegatedResolveAuthorityRaw) : (delegatedAuthority ? new PublicKey(delegatedAuthority) : new PublicKey('11111111111111111111111111111111')),
            mercyDiscountMultiplierBps: raw.mercyDiscountMultiplierBps ?? raw.mercy_discount_multiplier_bps ?? 10000,
        });
    }

    /**
     * Get a duel account by its address
     */
    async getDuel(duelAddress: PublicKey): Promise<DuelAccount & { address: PublicKey }> {
        const account = await this.program.account.duel.fetch(duelAddress);
        const raw = account as any;

        return new DuelAccount({
            ...account,
            address: duelAddress,
            mintB: account.mintB || null,
            winner: account.winner || null,
            loserSolSnapshot: raw.loserSolSnapshot ?? raw.loser_sol_snapshot ?? new BN(0),
        }) as DuelAccount & { address: PublicKey };
    }

    /**
     * Get the active duel for a token (if any)
     * Returns null if the token is not in an active matched duel
     * Only returns duels with status Active (matched), not Pending (unmatched) or Resolved (ended)
     * Self-healing fallback: if bonding curve has lastDuel but duelStatus is stale (e.g. Pending),
     * fetches the actual duel account and returns it when the duel is Active so UI can show "in duel".
     */
    async getDuelForToken(mint: PublicKey): Promise<(DuelAccount & { address: PublicKey }) | null> {
        const bondingCurve = await this.getBondingCurve(mint);

        if (!bondingCurve.lastDuel) {
            return null;
        }

        // Curve says active — return duel
        if (bondingCurve.duelStatus && 'active' in bondingCurve.duelStatus) {
            return this.getDuel(bondingCurve.lastDuel);
        }

        // Self-healing fallback: curve has lastDuel but status is stale; check actual duel account
        const duel = await this.getDuel(bondingCurve.lastDuel);
        if (duel.isActive()) {
            return duel;
        }

        return null;
    }

    /**
     * Get the last duel for a token (if any), regardless of status
     * Returns null if the token has no duel history
     */
    async getLastDuelForToken(mint: PublicKey): Promise<(DuelAccount & { address: PublicKey }) | null> {
        const bondingCurve = await this.getBondingCurve(mint);

        if (!bondingCurve.lastDuel) {
            return null;
        }

        return this.getDuel(bondingCurve.lastDuel);
    }

    /**
     * Get all creator vault accounts for a creator wallet.
     * Creator vaults hold SOL fees from buys on the creator's token(s); one vault per bonding curve (per mint).
     * Uses getProgramAccounts filtered by BondingCurveAccount.creator, then derives creator vault PDA per curve.
     *
     * @param creatorWallet - Creator's wallet (bonding_curve.creator)
     * @param options.fetchBalances - If true, fetches SOL balance for each creator vault (default true)
     * @returns Array of { bondingCurve, creatorVault, balanceLamports? }. Mint is not included (derive from your own list of mints by creator, or use API tokens by creator).
     */
    async getCreatorVaultsForCreator(
        creatorWallet: PublicKey,
        options?: { fetchBalances?: boolean }
    ): Promise<{ bondingCurve: PublicKey; creatorVault: PublicKey; balanceLamports?: bigint }[]> {
        const fetchBalances = options?.fetchBalances !== false;
        const accounts = await this.connection.getProgramAccounts(this.programId, {
            filters: [
                { memcmp: { offset: 8, bytes: creatorWallet.toBase58() } },
            ],
        });
        const out: { bondingCurve: PublicKey; creatorVault: PublicKey; balanceLamports?: bigint }[] = [];
        for (const { pubkey } of accounts) {
            const [creatorVault] = deriveCreatorVaultPda(pubkey, this.programId);
            out.push({ bondingCurve: pubkey, creatorVault });
        }
        if (fetchBalances && out.length > 0) {
            const infos = await this.connection.getMultipleAccountsInfo(out.map((o) => o.creatorVault));
            infos.forEach((info, i) => {
                if (out[i]) out[i].balanceLamports = BigInt(info?.lamports ?? 0);
            });
        }
        return out;
    }

    /**
     * Get comprehensive token info
     */
    async getTokenInfo(mint: PublicKey): Promise<TokenInfo> {
        const bondingCurve = await this.getBondingCurve(mint);
        const config = await this.getConfig();

        // Calculate price for 1 SOL input
        const spendableSolIn = new BN(1_000_000_000);
        const totalFeeBps = config.protocolFeeBps + config.creatorFeeBps;
        const netSol = spendableSolIn.mul(new BN(10_000)).div(new BN(10_000 + totalFeeBps));

        const netSolMinusOne = netSol.sub(new BN(1));
        const denominator = bondingCurve.virtualSolReserves.add(netSolMinusOne);

        const tokensOut = denominator.gt(new BN(0))
            ? netSolMinusOne.mul(bondingCurve.virtualTokenReserves).div(denominator)
            : new BN(0);

        // Price and mcap use virtual_sol only (PumpFun-style; updated on buy and duel winner)
        const pricePerTokenLamports = getTokenPrice(bondingCurve);
        const pricePerTokenSol = getTokenPriceInSol(bondingCurve);
        const marketCap = getMarketCap(bondingCurve);

        return {
            mint: mint.toString(),
            creator: bondingCurve.creator.toString(),
            bondingCurve: {
                address: bondingCurve.address?.toString() || "",
                virtualSolReserves: bondingCurve.virtualSolReserves.toString(),
                virtualTokenReserves: bondingCurve.virtualTokenReserves.toString(),
                realSolReserves: bondingCurve.realSolReserves.toString(),
                realTokenReserves: bondingCurve.realTokenReserves.toString(),
                initialRealTokenReserves: config.initialRealTokenReserves.toString(),
                tokenTotalSupply: bondingCurve.tokenTotalSupply.toString(),
                roundWins: bondingCurve.roundWins.toString(),
                complete: bondingCurve.complete,
            },
            price: {
                perTokenSol: pricePerTokenSol,
                perTokenLamports: pricePerTokenLamports.toString(),
                tokensOutFor1Sol: tokensOut.toString(),
                netSolFor1Sol: netSol.toString(),
            },
            marketCap: marketCap.toString(),
            reserves: {
                sol: bondingCurve.realSolReserves.toString(),
                tokens: bondingCurve.realTokenReserves.toString(),
            },
            supply: {
                total: bondingCurve.tokenTotalSupply.toString(),
                circulating: bondingCurve.tokenTotalSupply.sub(bondingCurve.realTokenReserves).toString(),
            },
            graduated: bondingCurve.complete,
        };
    }

    // ============================================================================
    // Event Listeners
    // ============================================================================

    /**
     * Add a listener for launchTokenEvent
     */
    onLaunchToken(
        callback: (event: LaunchTokenEvent, slot: number, signature: string) => void,
    ): number {
        return this.program.addEventListener(
            "launchTokenEvent",
            (event: any, slot: number, signature: string) => {
                callback(toLaunchTokenEvent(event), slot, signature);
            }
        );
    }

    /**
     * Add a listener for tradeEvent
     */
    onTrade(
        callback: (event: TradeEvent, slot: number, signature: string) => void,
    ): number {
        return this.program.addEventListener(
            "tradeEvent",
            (event: any, slot: number, signature: string) => {
                callback(toTradeEvent(event), slot, signature);
            }
        );
    }

    /**
     * Add a listener for duelCreatedEvent
     */
    onDuelCreated(
        callback: (event: DuelCreatedEvent, slot: number, signature: string) => void,
    ): number {
        return this.program.addEventListener(
            "duelCreatedEvent",
            (event: any, slot: number, signature: string) => {
                callback(toDuelCreatedEvent(event), slot, signature);
            }
        );
    }

    /**
     * Add a listener for duelMatchedEvent
     */
    onDuelMatched(
        callback: (event: DuelMatchedEvent, slot: number, signature: string) => void,
    ): number {
        return this.program.addEventListener(
            "duelMatchedEvent",
            (event: any, slot: number, signature: string) => {
                callback(toDuelMatchedEvent(event), slot, signature);
            }
        );
    }

    /**
     * Add a listener for duelPairingFailedEvent
     */
    onDuelPairingFailed(
        callback: (event: DuelPairingFailedEvent, slot: number, signature: string) => void,
    ): number {
        return this.program.addEventListener(
            "duelPairingFailedEvent",
            (event: any, slot: number, signature: string) => {
                callback(toDuelPairingFailedEvent(event), slot, signature);
            }
        );
    }

    /**
     * Add a listener for duelResolvedEvent
     */
    onDuelResolved(
        callback: (event: DuelResolvedEvent, slot: number, signature: string) => void,
    ): number {
        return this.program.addEventListener(
            "duelResolvedEvent",
            (event: any, slot: number, signature: string) => {
                callback(toDuelResolvedEvent(event), slot, signature);
            }
        );
    }

    /**
     * Add a listener for claimMercyEvent
     */
    onClaimMercy(
        callback: (event: ClaimMercyEvent, slot: number, signature: string) => void,
    ): number {
        return this.program.addEventListener(
            "claimMercyEvent",
            (event: any, slot: number, signature: string) => {
                callback(toClaimMercyEvent(event), slot, signature);
            }
        );
    }

    /**
     * Add a listener for tokenGraduatedEvent
     */
    onTokenGraduated(
        callback: (event: TokenGraduatedEvent, slot: number, signature: string) => void,
    ): number {
        return this.program.addEventListener(
            "tokenGraduatedEvent",
            (event: any, slot: number, signature: string) => {
                callback(toTokenGraduatedEvent(event), slot, signature);
            }
        );
    }

    /**
     * Remove an event listener
     */
    removeEventListener(eventId: number): void {
        this.program.removeEventListener(eventId);
    }
}
