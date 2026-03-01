import { PublicKey } from "@solana/web3.js";
import { blake3 } from "@noble/hashes/blake3.js";
import type { ConfigData } from "../types";

/**
 * Minimum duel-eligible mcap (lamports) from config: (initial_virtual_sol * total_supply) / initial_virtual_token_reserves.
 */
export function configMinMcapLamports(config: ConfigData): bigint {
    const num = BigInt(config.initialVirtualSolReserves.toString()) * BigInt(config.totalSupply.toString());
    const denom = BigInt(config.initialVirtualTokenReserves.toString());
    if (denom === 0n) return 0n;
    return num / denom;
}

/**
 * Convert market cap (lamports) to bucket index using config-driven formula.
 * Bands: [l_min, l_min*r), [l_min*r, l_min*r²), ... with r = mcapBucketGapBps/10000 (e.g. 11000 = 10% gap).
 * Returns null if mcap < minimum duel-eligible mcap (from config).
 */
export function mcapToBucket(mcapLamports: bigint | number, config: ConfigData): number | null {
    const mcap = typeof mcapLamports === "bigint" ? mcapLamports : BigInt(mcapLamports);
    const lMin = configMinMcapLamports(config);
    if (mcap < lMin) return null;

    const rBps = BigInt(config.mcapBucketGapBps ?? 11000);
    if (rBps === 0n) return null;

    let bound = lMin;
    let i = 0;
    while (mcap >= bound) {
        const next = (bound * rBps) / 10000n;
        if (next > bound && next <= Number.MAX_SAFE_INTEGER) {
            bound = next;
        } else {
            break;
        }
        i += 1;
    }
    return Math.max(0, i - 1);
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
 * Bucket range is no longer fixed; use config-driven formula. Returns null.
 * @deprecated Use mcapToBucket(mcap, config) for bucket index; range is [l_min*r^i, l_min*r^(i+1)) with l_min and r from config.
 */
export function getBucketRange(_bucket: number): { min: number; max: number } | null {
    return null;
}

/**
 * Check if a token is eligible for matchmaking (mcap >= min from config and bucket exists).
 * Actual eligibility also depends on on-chain state.
 */
export function isEligibleMcap(mcapLamports: bigint | number, config: ConfigData): boolean {
    return mcapToBucket(mcapLamports, config) !== null;
}


