import { PublicKey } from "@solana/web3.js";
import { LaunchTokenEvent, TradeEvent, DuelCreatedEvent, DuelMatchedEvent, DuelPairingFailedEvent, DuelResolvedEvent, ClaimMercyEvent, TokenGraduatedEvent } from "./types";

/**
 * Parse raw launch token event data
 */
export function toLaunchTokenEvent(event: any): LaunchTokenEvent {
    return {
        mint: new PublicKey(event.mint),
        bondingCurve: new PublicKey(event.bondingCurve),
        name: event.name,
        symbol: event.symbol,
        uri: event.uri,
        creator: new PublicKey(event.creator),
        timestamp: event.timestamp.toNumber ? event.timestamp.toNumber() : event.timestamp,
    };
}

/**
 * Parse raw trade event data
 */
export function toTradeEvent(event: any): TradeEvent {
    return {
        mint: new PublicKey(event.mint),
        solAmount: event.solAmount.toNumber ? event.solAmount.toNumber() : Number(event.solAmount),
        tokenAmount: event.tokenAmount.toNumber ? event.tokenAmount.toNumber() : Number(event.tokenAmount),
        isBuy: event.isBuy,
        user: new PublicKey(event.user),
        timestamp: event.timestamp.toNumber ? event.timestamp.toNumber() : event.timestamp,
        virtualSolReserves: event.virtualSolReserves.toNumber ? event.virtualSolReserves.toNumber() : Number(event.virtualSolReserves),
        virtualTokenReserves: event.virtualTokenReserves.toNumber ? event.virtualTokenReserves.toNumber() : Number(event.virtualTokenReserves),
        realSolReserves: event.realSolReserves.toNumber ? event.realSolReserves.toNumber() : Number(event.realSolReserves),
        realTokenReserves: event.realTokenReserves.toNumber ? event.realTokenReserves.toNumber() : Number(event.realTokenReserves),
        fee: event.fee.toNumber ? event.fee.toNumber() : Number(event.fee),
        creatorFee: event.creatorFee.toNumber ? event.creatorFee.toNumber() : Number(event.creatorFee),
        ixName: event.ixName,
    };
}

/**
 * Parse raw duel created event data
 */
export function toDuelCreatedEvent(event: any): DuelCreatedEvent {
    return {
        duel: new PublicKey(event.duel),
        mintA: new PublicKey(event.mintA),
        bucket: event.bucket,
        window: event.window.toNumber ? event.window.toNumber() : Number(event.window),
        slot: event.slot.toNumber ? event.slot.toNumber() : Number(event.slot),
    };
}

/**
 * Parse raw duel matched event data
 */
export function toDuelMatchedEvent(event: any): DuelMatchedEvent {
    return {
        duel: new PublicKey(event.duel),
        mintA: new PublicKey(event.mintA),
        mintB: new PublicKey(event.mintB),
        bucket: event.bucket,
        window: event.window.toNumber ? event.window.toNumber() : Number(event.window),
        slot: event.slot.toNumber ? event.slot.toNumber() : Number(event.slot),
    };
}

/**
 * Parse raw duel pairing failed event data
 */
export function toDuelPairingFailedEvent(event: any): DuelPairingFailedEvent {
    return {
        duel: new PublicKey(event.duel),
        mint: new PublicKey(event.mint),
        mintA: new PublicKey(event.mintA),
        mintB: new PublicKey(event.mintB),
        bucket: event.bucket,
        window: event.window.toNumber ? event.window.toNumber() : Number(event.window),
        slot: event.slot.toNumber ? event.slot.toNumber() : Number(event.slot),
        reason: event.reason,
    };
}

/**
 * Parse raw duel resolved event data.
 * Anchor IDL uses snake_case (sol_used, winner_tokens_bought, etc.); support both.
 */
export function toDuelResolvedEvent(event: any): DuelResolvedEvent {
    const winnerMint = event.winnerMint ?? event.winner_mint;
    const loserMint = event.loserMint ?? event.loser_mint;
    const targetMcap = event.targetMcap ?? event.target_mcap;
    const solUsed = event.solUsed ?? event.sol_used;
    const winnerTokensBought = event.winnerTokensBought ?? event.winner_tokens_bought;
    const protocolFee = event.protocolFee ?? event.protocol_fee;
    const timestamp = event.timestamp;
    const n = (v: any) => (v?.toNumber ? v.toNumber() : Number(v ?? 0));
    return {
        duel: new PublicKey(event.duel),
        winnerMint: new PublicKey(winnerMint),
        loserMint: new PublicKey(loserMint),
        targetMcap: n(targetMcap),
        solUsed: n(solUsed),
        winnerTokensBought: n(winnerTokensBought),
        protocolFee: n(protocolFee),
        timestamp: typeof timestamp?.toNumber === 'function' ? timestamp.toNumber() : Number(timestamp ?? 0),
    };
}

/**
 * Parse raw claim mercy event data
 */
export function toClaimMercyEvent(event: any): ClaimMercyEvent {
    const bondingCurveLoser = event.bondingCurveLoser ?? event.bonding_curve_loser;
    const claimAmount = event.claimAmount ?? event.claim_amount;
    const ts = event.timestamp?.toNumber ? event.timestamp.toNumber() : Number(event.timestamp ?? 0);
    return {
        user: new PublicKey(event.user),
        duel: new PublicKey(event.duel),
        bondingCurveLoser: new PublicKey(bondingCurveLoser),
        claimAmount: claimAmount?.toNumber ? claimAmount.toNumber() : Number(claimAmount ?? 0),
        timestamp: ts,
    };
}

/**
 * Parse raw token graduated event data
 */
export function toTokenGraduatedEvent(event: any): TokenGraduatedEvent {
    const fee = event.graduationFeeLamports ?? event.graduation_fee_lamports;
    const reserves = event.realSolReservesAtGraduation ?? event.real_sol_reserves_at_graduation;
    const ts = event.timestamp?.toNumber ? event.timestamp.toNumber() : Number(event.timestamp ?? 0);
    return {
        mint: new PublicKey(event.mint),
        creator: new PublicKey(event.creator),
        pool: new PublicKey(event.pool ?? "11111111111111111111111111111111"),
        graduationFeeLamports: fee?.toNumber ? fee.toNumber() : Number(fee ?? 0),
        realSolReservesAtGraduation: reserves?.toNumber ? reserves.toNumber() : Number(reserves ?? 0),
        timestamp: ts,
    };
}
