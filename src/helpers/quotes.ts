import { BN } from "@coral-xyz/anchor";
import { BuyQuoteParams, SellQuoteParams, QuoteResult, BondingCurveData } from "../types";

/**
 * Calculate tokens received for a given SOL input
 * Uses the bonding curve formula: tokens_out = floor((net_sol - 1) * virtual_token_reserves / (virtual_sol_reserves + net_sol - 1))
 */
export function calculateBuyQuote(params: BuyQuoteParams): QuoteResult {
    const {
        virtualSolReserves,
        virtualTokenReserves,
        realTokenReserves,
        solIn,
        protocolFeeBps = 95,
        creatorFeeBps = 30,
    } = params;

    const totalFeeBps = protocolFeeBps + creatorFeeBps;

    // net_sol = floor(spendable_sol_in * 10_000 / (10_000 + total_fee_bps))
    const netSol = solIn.mul(new BN(10_000)).div(new BN(10_000 + totalFeeBps));

    // Calculate fees
    const totalFee = solIn.sub(netSol);
    const protocolFee = totalFee.mul(new BN(protocolFeeBps)).div(new BN(totalFeeBps));
    const creatorFee = totalFee.sub(protocolFee);

    // tokens_out = floor((net_sol - 1) * virtual_token_reserves / (virtual_sol_reserves + net_sol - 1))
    const netSolMinusOne = netSol.sub(new BN(1));
    const denominator = virtualSolReserves.add(netSolMinusOne);

    let tokensOut = new BN(0);
    if (denominator.gt(new BN(0))) {
        tokensOut = netSolMinusOne.mul(virtualTokenReserves).div(denominator);
    }

    // Cap at real token reserves
    if (tokensOut.gt(realTokenReserves)) {
        tokensOut = realTokenReserves;
    }

    return {
        amountOut: tokensOut,
        fee: protocolFee,
        creatorFee,
        netAmount: netSol,
    };
}

/**
 * Calculate SOL received for a given token input
 * Uses the bonding curve formula: sol_out = floor(tokens_in * virtual_sol_reserves / (virtual_token_reserves + tokens_in))
 */
export function calculateSellQuote(params: SellQuoteParams): QuoteResult {
    const { virtualSolReserves, virtualTokenReserves, realSolReserves, tokensIn } = params;

    if (tokensIn.lte(new BN(0)) || virtualTokenReserves.eq(new BN(0))) {
        return { amountOut: new BN(0), fee: new BN(0), creatorFee: new BN(0), netAmount: new BN(0) };
    }

    const denominator = virtualTokenReserves.add(tokensIn);

    let solOut = new BN(0);
    if (denominator.gt(new BN(0))) {
        solOut = tokensIn.mul(virtualSolReserves).div(denominator);
    }

    // Cap at real SOL reserves
    if (solOut.gt(realSolReserves)) {
        solOut = realSolReserves;
    }

    return {
        amountOut: solOut,
        fee: new BN(0),
        creatorFee: new BN(0),
        netAmount: solOut,
    };
}

/**
 * Get current price per token in lamports
 */
export function getTokenPrice(bondingCurve: BondingCurveData): bigint {
    if (bondingCurve.virtualTokenReserves.eq(new BN(0))) {
        return 0n;
    }

    // Price = (virtual_sol_reserves * 1_000_000) / virtual_token_reserves
    const price = bondingCurve.virtualSolReserves
        .mul(new BN(1_000_000))
        .div(bondingCurve.virtualTokenReserves);

    return BigInt(price.toString());
}

/**
 * Get token price in SOL (decimal)
 */
export function getTokenPriceInSol(bondingCurve: BondingCurveData): number {
    const priceLamports = getTokenPrice(bondingCurve);
    return Number(priceLamports) / 1_000_000_000;
}

/**
 * Calculate market cap in lamports
 * Formula: market_cap = (token_total_supply * virtual_sol_reserves) / virtual_token_reserves
 */
export function getMarketCap(bondingCurve: BondingCurveData): bigint {
    if (bondingCurve.virtualTokenReserves.eq(new BN(0))) {
        return 0n;
    }

    const marketCap = bondingCurve.tokenTotalSupply
        .mul(bondingCurve.virtualSolReserves)
        .div(bondingCurve.virtualTokenReserves);

    return BigInt(marketCap.toString());
}

/**
 * Calculate market cap in SOL (decimal)
 */
export function getMarketCapInSol(bondingCurve: BondingCurveData): number {
    const mcapLamports = getMarketCap(bondingCurve);
    return Number(mcapLamports) / 1_000_000_000;
}

/**
 * Convert SOL amount to USD given a SOL price
 */
export function solToUsd(solAmount: number, solPriceUsd: number): number {
    return solAmount * solPriceUsd;
}

/**
 * Calculate slippage for buy (add buffer)
 */
export function calculateWithSlippageBuy(amount: bigint, basisPoints: bigint): bigint {
    return amount + (amount * basisPoints) / 10000n;
}

/**
 * Calculate slippage for sell (subtract buffer)
 */
export function calculateWithSlippageSell(amount: bigint, basisPoints: bigint): bigint {
    return amount - (amount * basisPoints) / 10000n;
}
