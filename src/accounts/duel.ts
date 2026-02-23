import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { DuelData, RoundStatus } from "../types";

/**
 * DuelAccount - parsed duel data
 */
export class DuelAccount implements DuelData {
    public address?: PublicKey;
    public mintA: PublicKey;
    public mintB: PublicKey | null;
    public bucket: number;
    public window: BN;
    public startSlot: BN;
    public targetMcap: BN;
    public status: RoundStatus;
    public winner: PublicKey | null;
    public bump: number;
    public loserSolSnapshot: BN;
    public tokenAMcapAtStart: BN;
    public tokenBMcapAtStart: BN;

    constructor(data: DuelData) {
        this.address = data.address;
        this.mintA = data.mintA;
        this.mintB = data.mintB;
        this.bucket = data.bucket;
        this.window = new BN(data.window);
        this.startSlot = new BN(data.startSlot);
        this.targetMcap = new BN(data.targetMcap);
        this.status = data.status;
        this.winner = data.winner;
        this.bump = data.bump;
        const snapshot = (data as any).loserSolSnapshot ?? (data as any).loser_sol_snapshot;
        this.loserSolSnapshot = snapshot != null ? new BN(snapshot) : new BN(0);
        const raw = data as any;
        this.tokenAMcapAtStart = raw?.tokenAMcapAtStart != null || raw?.token_a_mcap_at_start != null
            ? new BN(raw.tokenAMcapAtStart ?? raw.token_a_mcap_at_start) : new BN(0);
        this.tokenBMcapAtStart = raw?.tokenBMcapAtStart != null || raw?.token_b_mcap_at_start != null
            ? new BN(raw.tokenBMcapAtStart ?? raw.token_b_mcap_at_start) : new BN(0);
    }

    /**
     * Check if duel is pending (unmatched)
     */
    isPending(): boolean {
        return 'pending' in this.status;
    }

    /**
     * Check if duel is active (matched and active)
     */
    isActive(): boolean {
        return 'active' in this.status;
    }

    /**
     * Check if duel is resolved (ended)
     */
    isResolved(): boolean {
        return 'resolved' in this.status;
    }

    /**
     * Check if duel is matched (has both mints)
     */
    isMatched(): boolean {
        return this.mintB !== null;
    }

    /**
     * Get target market cap in lamports
     */
    getTargetMcapLamports(): BN {
        return this.targetMcap;
    }
}
