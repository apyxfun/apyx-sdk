import { PublicKey } from "@solana/web3.js";
import { struct, bool, u64, u128, u8, publicKey, option } from "@coral-xyz/borsh";
import { BN } from "@coral-xyz/anchor";
import { BondingCurveData, RoundStatus } from "../types";

/**
 * BondingCurveAccount - parsed bonding curve data
 */
export class BondingCurveAccount implements BondingCurveData {
    public address?: PublicKey;
    public creator: PublicKey;
    public virtualSolReserves: BN;
    public virtualTokenReserves: BN;
    public realSolReserves: BN;
    public realTokenReserves: BN;
    public tokenTotalSupply: BN;
    public roundWins: BN;
    public complete: boolean;
    public bump: number;
    public lastDuel: PublicKey | null;
    public duelStatus: RoundStatus | null;
    public lastDuelSlot: BN;

    constructor(data: {
        creator: PublicKey;
        virtualSolReserves: BN;
        virtualTokenReserves: BN;
        realSolReserves: BN;
        realTokenReserves: BN;
        tokenTotalSupply: BN;
        roundWins: BN;
        complete: boolean;
        bump: number;
        address?: PublicKey;
        lastDuel?: PublicKey | null;
        duelStatus?: RoundStatus | null;
        lastDuelSlot?: BN;
    }) {
        this.creator = data.creator;
        this.virtualSolReserves = data.virtualSolReserves;
        this.virtualTokenReserves = data.virtualTokenReserves;
        this.realSolReserves = data.realSolReserves;
        this.realTokenReserves = data.realTokenReserves;
        this.tokenTotalSupply = data.tokenTotalSupply;
        this.roundWins = data.roundWins;
        this.complete = data.complete;
        this.bump = data.bump;
        this.address = data.address;
        this.lastDuel = data.lastDuel || null;
        this.duelStatus = data.duelStatus || null;
        this.lastDuelSlot = data.lastDuelSlot || new BN(0);
    }

    /**
     * Calculate tokens out for given SOL in using bonding curve formula
     */
    getBuyPrice(solIn: bigint): bigint {
        if (this.complete) {
            throw new Error("Curve is complete");
        }

        if (solIn <= 0n) {
            return 0n;
        }

        const virtualSol = BigInt(this.virtualSolReserves.toString());
        const virtualToken = BigInt(this.virtualTokenReserves.toString());
        const realToken = BigInt(this.realTokenReserves.toString());

        const solInMinusOne = solIn - 1n;
        const denominator = virtualSol + solInMinusOne;

        if (denominator === 0n) {
            return 0n;
        }

        const tokensOut = (solInMinusOne * virtualToken) / denominator;
        return tokensOut < realToken ? tokensOut : realToken;
    }

    /**
     * Calculate SOL out for given tokens in using bonding curve formula
     */
    getSellPrice(tokensIn: bigint): bigint {
        if (this.complete) {
            throw new Error("Curve is complete");
        }

        const virtualSol = BigInt(this.virtualSolReserves.toString());
        const virtualToken = BigInt(this.virtualTokenReserves.toString());
        const realSol = BigInt(this.realSolReserves.toString());

        if (tokensIn <= 0n || virtualToken === 0n) {
            return 0n;
        }

        const denominator = virtualToken + tokensIn;

        if (denominator === 0n) {
            return 0n;
        }

        const solOut = (tokensIn * virtualSol) / denominator;
        return solOut < realSol ? solOut : realSol;
    }

    /**
     * Calculate market cap in lamports
     */
    getMarketCapLamports(): bigint {
        const virtualSol = BigInt(this.virtualSolReserves.toString());
        const virtualToken = BigInt(this.virtualTokenReserves.toString());
        const totalSupply = BigInt(this.tokenTotalSupply.toString());

        if (virtualToken === 0n) {
            return 0n;
        }

        return (totalSupply * virtualSol) / virtualToken;
    }

    /**
     * Get current price per token in lamports
     */
    getPricePerTokenLamports(): bigint {
        const virtualSol = BigInt(this.virtualSolReserves.toString());
        const virtualToken = BigInt(this.virtualTokenReserves.toString());

        if (virtualToken === 0n) {
            return 0n;
        }

        return (virtualSol * 1_000_000n) / virtualToken;
    }

    /**
     * Check if token is in an active duel (matched and active)
     */
    isInDuel(): boolean {
        return this.duelStatus !== null && 'active' in this.duelStatus;
    }

    /**
     * Check if token has a pending duel (unmatched)
     */
    hasPendingDuel(): boolean {
        return this.duelStatus !== null && 'pending' in this.duelStatus;
    }

    /**
     * Check if token has a resolved duel (ended)
     */
    hasResolvedDuel(): boolean {
        return this.duelStatus !== null && 'resolved' in this.duelStatus;
    }

    /**
     * Parse from raw account data buffer
     * Note: For full parsing including duelStatus enum, prefer using Anchor's program.account.fetch
     * which handles enum parsing automatically. This method provides basic parsing for compatibility.
     */
    static fromBuffer(buffer: Buffer, address?: PublicKey): BondingCurveAccount {
        // Skip discriminator (8 bytes)
        const data = buffer.slice(8);

        // Parse fixed-size fields first
        let offset = 0;
        const creator = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        
        const virtualSolReserves = new BN(data.slice(offset, offset + 8), 'le');
        offset += 8;
        
        const virtualTokenReserves = new BN(data.slice(offset, offset + 16), 'le');
        offset += 16;
        
        const realSolReserves = new BN(data.slice(offset, offset + 8), 'le');
        offset += 8;
        
        const realTokenReserves = new BN(data.slice(offset, offset + 16), 'le');
        offset += 16;
        
        const tokenTotalSupply = new BN(data.slice(offset, offset + 16), 'le');
        offset += 16;
        
        const roundWins = new BN(data.slice(offset, offset + 8), 'le');
        offset += 8;
        
        const complete = data[offset] !== 0;
        offset += 1;
        
        const bump = data[offset];
        offset += 1;
        
        // Parse Option<Pubkey> for lastDuel (1 byte for Some/None + 32 bytes if Some)
        let lastDuel: PublicKey | null = null;
        const hasLastDuel = data[offset] !== 0;
        offset += 1;
        if (hasLastDuel) {
            lastDuel = new PublicKey(data.slice(offset, offset + 32));
            offset += 32;
        }
        
        // Parse Option<RoundStatus> for duelStatus
        // Option is 1 byte (0 = None, 1 = Some)
        // RoundStatus enum is 1 byte discriminator (0 = Pending, 1 = Active, 2 = Resolved)
        let duelStatus: RoundStatus | null = null;
        const hasDuelStatus = data[offset] !== 0;
        offset += 1;
        if (hasDuelStatus) {
            const discriminator = data[offset];
            offset += 1;
            if (discriminator === 0) {
                duelStatus = { pending: {} };
            } else if (discriminator === 1) {
                duelStatus = { active: {} };
            } else if (discriminator === 2) {
                duelStatus = { resolved: {} };
            }
        }
        
        const lastDuelSlot = new BN(data.slice(offset, offset + 8), 'le');

        return new BondingCurveAccount({
            creator,
            virtualSolReserves,
            virtualTokenReserves,
            realSolReserves,
            realTokenReserves,
            tokenTotalSupply,
            roundWins,
            complete,
            bump,
            address,
            lastDuel,
            duelStatus,
            lastDuelSlot,
        });
    }
}
