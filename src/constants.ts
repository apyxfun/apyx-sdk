import { PublicKey } from "@solana/web3.js";

/**
 * Apyx Program ID (Devnet/Mainnet)
 */
export const PROGRAM_ID = new PublicKey("APYzSaPqLXC9HJeMLwbMpgbFN5VJD8iLyZjSAZdvcZGM");

/**
 * Token-2022 Program ID
 */
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

/**
 * Associated Token Program ID
 */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

/**
 * PDA Seeds used for account derivation
 */
export const SEEDS = {
    CONFIG: "apyx_config",
    BONDING_CURVE: "bonding-curve",
    CREATOR_VAULT: "creator-vault",
    GRADUATION_ESCROW: "graduation-escrow",
    MINT_AUTHORITY: "mint-authority",
    DUEL: "duel",
    MERCY_VAULT: "mercy_vault",
    USER_POSITION: "user_position",
    USER: "user",
} as const;

/**
 * Default commitment levels
 */
export const DEFAULT_COMMITMENT = "confirmed" as const;
export const DEFAULT_FINALITY = "confirmed" as const;

/**
 * Token decimals
 */
export const TOKEN_DECIMALS = 6;
export const LAMPORTS_PER_SOL = 1_000_000_000;
