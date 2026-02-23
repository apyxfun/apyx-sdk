import { PublicKey } from "@solana/web3.js";

/**
 * Event emitted when a token is launched
 */
export interface LaunchTokenEvent {
    mint: PublicKey;
    bondingCurve: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    creator: PublicKey;
    timestamp: number;
}

/**
 * Event emitted on buy/sell trades
 */
export interface TradeEvent {
    mint: PublicKey;
    solAmount: number;
    tokenAmount: number;
    isBuy: boolean;
    user: PublicKey;
    timestamp: number;
    virtualSolReserves: number;
    virtualTokenReserves: number;
    realSolReserves: number;
    realTokenReserves: number;
    fee: number;
    creatorFee: number;
    ixName: string;
}

/**
 * Event emitted when a duel is created
 */
export interface DuelCreatedEvent {
    duel: PublicKey;
    mintA: PublicKey;
    bucket: number;
    window: number;
    slot: number;
}

/**
 * Event emitted when two tokens are matched in a duel
 */
export interface DuelMatchedEvent {
    duel: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
    bucket: number;
    window: number;
    slot: number;
}

/**
 * Event emitted when a duel pairing fails
 */
export interface DuelPairingFailedEvent {
    duel: PublicKey;
    mint: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
    bucket: number;
    window: number;
    slot: number;
    reason: string;
}

/**
 * Event emitted when a duel is resolved
 */
export interface DuelResolvedEvent {
    duel: PublicKey;
    winnerMint: PublicKey;
    loserMint: PublicKey;
    targetMcap: number;
    solUsed: number;
    winnerTokensBought: number;
    protocolFee: number;
    timestamp: number;
}

/**
 * Event emitted when a user claims mercy (redeem loser tokens for winner tokens)
 */
export interface ClaimMercyEvent {
    user: PublicKey;
    duel: PublicKey;
    bondingCurveLoser: PublicKey;
    claimAmount: number;
    timestamp: number;
}

/**
 * Event emitted when a token graduates (bonding curve exhausted, optional PumpSwap pool created)
 */
export interface TokenGraduatedEvent {
    mint: PublicKey;
    creator: PublicKey;
    pool: PublicKey;
    graduationFeeLamports: number;
    realSolReservesAtGraduation: number;
    timestamp: number;
}

export interface ApyxEventHandlers {
    launchTokenEvent: LaunchTokenEvent;
    tradeEvent: TradeEvent;
    duelCreatedEvent: DuelCreatedEvent;
    duelMatchedEvent: DuelMatchedEvent;
    duelPairingFailedEvent: DuelPairingFailedEvent;
    duelResolvedEvent: DuelResolvedEvent;
    claimMercyEvent: ClaimMercyEvent;
    tokenGraduatedEvent: TokenGraduatedEvent;
}

export type ApyxEventType = keyof ApyxEventHandlers;

export type EventCallback<T extends ApyxEventType> = (
    event: ApyxEventHandlers[T],
    slot: number,
    signature: string
) => void;
