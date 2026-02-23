import { PublicKey } from "@solana/web3.js";
import { blake3 } from "@noble/hashes/blake3.js";
import { LAMPORTS_PER_SOL } from "../constants";

/**
 * Market cap bucket ranges in SOL
 * Covers 30 SOL (launch) to ~800 SOL (bonding curve complete)
 */
const BUCKET_RANGES: Array<{ min: number; max: number }> = [
    { min: 30, max: 40 },    // Bucket 0
    { min: 40, max: 55 },    // Bucket 1
    { min: 55, max: 75 },    // Bucket 2
    { min: 75, max: 100 },   // Bucket 3
    { min: 100, max: 130 },  // Bucket 4
    { min: 130, max: 170 },  // Bucket 5
    { min: 170, max: 220 },  // Bucket 6
    { min: 220, max: 280 },  // Bucket 7
    { min: 280, max: 350 },  // Bucket 8
    { min: 350, max: 450 },  // Bucket 9
    { min: 450, max: 600 },  // Bucket 10
    { min: 600, max: 800 },  // Bucket 11
];

/**
 * Convert market cap (in lamports) to bucket (0-11)
 * Returns null if market cap is outside duel-eligible range
 */
export function mcapToBucket(mcapLamports: bigint | number): number | null {
    const mcap = typeof mcapLamports === "bigint" ? mcapLamports : BigInt(mcapLamports);
    const SOL = BigInt(LAMPORTS_PER_SOL);
    console.log('Mcap to bucket SOL:', mcap);

    for (let i = 0; i < BUCKET_RANGES.length; i++) {
        const { min, max } = BUCKET_RANGES[i];
        const minLamports = BigInt(min) * SOL;
        const maxLamports = BigInt(max) * SOL;

        // First bucket is inclusive on both ends
        // Other buckets are exclusive on min, inclusive on max
        if (i === 0) {
            if (mcap >= minLamports && mcap <= maxLamports) return i;
        } else {
            if (mcap > minLamports && mcap <= maxLamports) return i;
        }
    }

    return null;
}

/**
 * Get the current time window from a slot number
 * @param slot - Current slot number
 * @param windowSize - Window size in slots (from config)
 */
export function currentWindow(slot: number, windowSize: number): number {
    return Math.floor(slot / windowSize);
}

/**
 * Derive the deterministic match key for collision detection using blake3
 * 
 * @param mint - Token mint public key
 * @param bucket - Market cap bucket (0-11)
 * @param window - Time window number
 * @param space - Match key space (from config)
 * @returns Match key (0 to space-1)
 */
export function deriveMatchKey(
    mint: PublicKey,
    bucket: number,
    window: number,
    space: number
): number {
    // Build data: mint(32 bytes) + bucket(1 byte) + window(8 bytes LE)
    const windowBuf = Buffer.alloc(8);
    windowBuf.writeBigUInt64LE(BigInt(window));

    const data = Buffer.concat([
        mint.toBuffer(),
        Buffer.from([bucket]),
        windowBuf,
    ]);

    // Hash with blake3
    const hash = blake3(data);

    // Extract u16 from first 2 bytes (little endian) and mod by space
    const k = hash[0] | (hash[1] << 8);
    return k % space;
}

/**
 * Get the bucket range in SOL for a given bucket
 */
export function getBucketRange(bucket: number): { min: number; max: number } | null {
    if (bucket < 0 || bucket >= BUCKET_RANGES.length) {
        return null;
    }
    return BUCKET_RANGES[bucket];
}

/**
 * Check if a token is eligible for matchmaking
 * Simplified check - actual eligibility also depends on on-chain state
 */
export function isEligibleMcap(mcapLamports: bigint | number): boolean {
    return mcapToBucket(mcapLamports) !== null;
}


