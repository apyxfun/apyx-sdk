import { PublicKey, VersionedTransaction, VersionedTransactionResponse } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// ============================================================================
// Instruction Parameters
// ============================================================================

export interface LaunchTokenParams {
    /** The vanity-generated mint keypair */
    mintKeypair: import("@solana/web3.js").Keypair;
    /** Token name */
    name: string;
    /** Token symbol */
    symbol: string;
    /** IPFS URI for metadata */
    uri: string;
    /** Creator pubkey (preserved from off-chain creation) */
    creator: PublicKey;
}

export interface BuyParams {
    /** Token mint address */
    mint: PublicKey;
    /** SOL amount to spend (in lamports) */
    solAmount: BN;
    /** Minimum tokens to receive (slippage protection) */
    minTokensOut: BN;
    /** Optional PumpSwap pool index override for graduated token trades (default 0). */
    poolIndex?: number;
    /** Optional PumpSwap pool creator override for graduated token trades. */
    poolCreator?: PublicKey;
}

export interface SellParams {
    /** Token mint address */
    mint: PublicKey;
    /** Token amount to sell */
    tokenAmount: BN;
    /** Minimum SOL to receive (slippage protection) */
    minSolOut: BN;
    /** Optional PumpSwap pool index override for graduated token trades (default 0). */
    poolIndex?: number;
    /** Optional PumpSwap pool creator override for graduated token trades. */
    poolCreator?: PublicKey;
}

// ============================================================================
// Transaction Results
// ============================================================================

export interface TransactionResult {
    /** Base64 encoded transaction (for client signing) */
    transaction: string;
    /** Mint address if applicable */
    mint?: string;
    /** Bonding curve address */
    bondingCurve?: string;
    /** User wallet */
    userWallet?: string;
}

export interface SignedTransactionResult {
    signature?: string;
    error?: unknown;
    results?: VersionedTransactionResponse;
    success: boolean;
    transaction?: VersionedTransaction;
}

// ============================================================================
// Account Data Types
// ============================================================================

export interface BondingCurveData {
    address?: PublicKey;
    creator: PublicKey;
    virtualSolReserves: BN;
    virtualTokenReserves: BN;
    realSolReserves: BN;
    realTokenReserves: BN;
    tokenTotalSupply: BN;
    roundWins: BN;
    complete: boolean;
    bump: number;
    lastDuel: PublicKey | null;
    duelStatus: RoundStatus | null;
    lastDuelSlot: BN;
}

export interface ConfigData {
    admin: PublicKey;
    protocolFeeVault: PublicKey;
    protocolFeeBps: number;
    creatorFeeBps: number;
    /** Target mcap growth in bps (e.g. 11000 = 110%) */
    targetMcapGrowthBps: number;
    graduateTokens: boolean;
    graduationFeeLamports: BN;
    initialVirtualSolReserves: BN;
    initialVirtualTokenReserves: BN;
    initialRealTokenReserves: BN;
    totalSupply: BN;
    windowSizeSlots: BN;
    matchKeySpace: number;
    cooldownSlots: BN;
    /** Apyx system wallet for delegated auto-claim */
    delegatedClaimAuthority: PublicKey;
    /** Authority for resolve_duel and migrate (post-trade logic service) */
    delegatedResolveAuthority?: PublicKey;
    /** Mercy discount multiplier in bps (e.g. 10000 = 1.0, 11000 = 1.1). 0 treated as 10000. */
    mercyDiscountMultiplierBps?: number;
}

export interface DuelData {
    address?: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey | null;
    bucket: number;
    window: BN;
    startSlot: BN;
    targetMcap: BN;
    status: RoundStatus;
    winner: PublicKey | null;
    bump: number;
    /** Loser curve real_sol_reserves at resolution (for claim_mercy share math) */
    loserSolSnapshot: BN;
    /** Token A mcap (lamports) at duel creation; 0 for legacy accounts */
    tokenAMcapAtStart?: BN;
    /** Token B mcap (lamports) at duel join; 0 for legacy accounts */
    tokenBMcapAtStart?: BN;
}

/** User position (per user per bonding curve) for mercy claim and auto-claim */
export interface UserPositionData {
    user: PublicKey;
    /** Bonding curve pubkey for this position */
    duel: PublicKey;
    solContributed: BN;
    curveSolAtUpdate: BN;
    lastUpdated: BN;
    bump: number;
    autoClaimEnabled: boolean;
    delegatedWorker: PublicKey;
}

export type RoundStatus = { pending: {} } | { active: {} } | { resolved: {} };

// ============================================================================
// Quote Types
// ============================================================================

export interface BuyQuoteParams {
    virtualSolReserves: BN;
    virtualTokenReserves: BN;
    realTokenReserves: BN;
    solIn: BN;
    protocolFeeBps?: number;
    creatorFeeBps?: number;
}

export interface SellQuoteParams {
    virtualSolReserves: BN;
    virtualTokenReserves: BN;
    realSolReserves: BN;
    tokensIn: BN;
}

export interface QuoteResult {
    amountOut: BN;
    fee: BN;
    creatorFee: BN;
    netAmount: BN;
}

// ============================================================================
// Token Info
// ============================================================================

export interface TokenInfo {
    mint: string;
    creator: string;
    bondingCurve: {
        address: string;
        virtualSolReserves: string;
        virtualTokenReserves: string;
        realSolReserves: string;
        realTokenReserves: string;
        /** Initial token reserves on curve at launch (from config); used for progress toward graduation */
        initialRealTokenReserves?: string;
        tokenTotalSupply: string;
        roundWins: string;
        complete: boolean;
    };
    price: {
        perTokenSol: number;
        perTokenLamports: string;
        tokensOutFor1Sol: string;
        netSolFor1Sol: string;
    };
    marketCap: string;
    reserves: {
        sol: string;
        tokens: string;
    };
    supply: {
        total: string;
        circulating: string;
    };
    graduated: boolean;
}
