import { PublicKey } from "@solana/web3.js";
import { SEEDS, PROGRAM_ID } from "../constants";

/**
 * Derive the bonding curve PDA for a token mint
 */
export function deriveBondingCurvePda(
    mint: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.BONDING_CURVE), mint.toBuffer()],
        programId
    );
}

/**
 * Derive the config PDA
 */
export function deriveConfigPda(
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.CONFIG)],
        programId
    );
}

/**
 * Derive the creator vault PDA for a bonding curve
 */
export function deriveCreatorVaultPda(
    bondingCurve: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.CREATOR_VAULT), bondingCurve.toBuffer()],
        programId
    );
}

/**
 * Derive graduation escrow PDA for a mint
 */
export function deriveGraduationEscrowPda(
    mint: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.GRADUATION_ESCROW), mint.toBuffer()],
        programId
    );
}

/**
 * Derive the mint authority PDA
 */
export function deriveMintAuthorityPda(
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.MINT_AUTHORITY)],
        programId
    );
}

/**
 * Derive a duel PDA from matchmaking parameters
 */
export function deriveDuelPda(
    bucket: number,
    window: number,
    matchKey: number,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    const windowBuf = Buffer.alloc(8);
    windowBuf.writeBigUInt64LE(BigInt(window));

    const matchKeyBuf = Buffer.alloc(2);
    matchKeyBuf.writeUInt16LE(matchKey);

    return PublicKey.findProgramAddressSync(
        [
            Buffer.from(SEEDS.DUEL),
            Buffer.from([bucket]),
            windowBuf,
            matchKeyBuf,
        ],
        programId
    );
}

/**
 * Derive mercy vault PDA for a losing bonding curve and duel
 */
export function deriveMercyVaultPda(
    loserBondingCurve: PublicKey,
    duel: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.MERCY_VAULT), loserBondingCurve.toBuffer(), duel.toBuffer()],
        programId
    );
}

/**
 * Derive user position PDA (per user per bonding curve)
 */
export function deriveUserPositionPda(
    user: PublicKey,
    bondingCurve: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.USER_POSITION), user.toBuffer(), bondingCurve.toBuffer()],
        programId
    );
}

/**
 * Derive user settings PDA (per wallet; stores auto_claim_mercy etc.)
 */
export function deriveUserSettingsPda(
    wallet: PublicKey,
    programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.USER), wallet.toBuffer()],
        programId
    );
}
