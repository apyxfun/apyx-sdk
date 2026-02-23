import { BN } from "@coral-xyz/anchor";

const TEN_THOUSAND = new BN(10_000);
const ONE = new BN(1);
const ONE_BILLION = new BN(1_000_000_000);

export interface BuyDeltaParams {
    spendableSolIn: BN;
    virtualSolReserves: BN;
    virtualTokenReserves: BN;
    protocolFeeBps: number;
    creatorFeeBps: number;
}

export interface BuyDeltas {
    adjustedNetSol: BN;
    tokensOut: BN;
    protocolFee: BN;
    creatorFee: BN;
}

export function computeBuyDeltas(params: BuyDeltaParams): BuyDeltas {
    const { spendableSolIn, virtualSolReserves, virtualTokenReserves, protocolFeeBps, creatorFeeBps } = params;

    const totalFeeBps = protocolFeeBps + creatorFeeBps;

    const netSol = spendableSolIn
        .mul(TEN_THOUSAND)
        .div(TEN_THOUSAND.add(new BN(totalFeeBps)));

    const protocolFee = netSol
        .mul(new BN(protocolFeeBps))
        .add(TEN_THOUSAND.sub(ONE))
        .div(TEN_THOUSAND);

    const creatorFee = netSol
        .mul(new BN(creatorFeeBps))
        .add(TEN_THOUSAND.sub(ONE))
        .div(TEN_THOUSAND);

    const totalFees = protocolFee.add(creatorFee);

    let adjustedNetSol = netSol;
    if (netSol.add(totalFees).gt(spendableSolIn)) {
        adjustedNetSol = netSol.sub(netSol.add(totalFees).sub(spendableSolIn));
    }

    let tokensOut = new BN(0);
    if (adjustedNetSol.gt(new BN(0))) {
        const netSolMinusOne = adjustedNetSol.sub(ONE);
        const denominator = virtualSolReserves.add(netSolMinusOne);
        if (denominator.gt(new BN(0))) {
            tokensOut = netSolMinusOne.mul(virtualTokenReserves).div(denominator);
        }
    }

    return {
        adjustedNetSol,
        tokensOut,
        protocolFee,
        creatorFee,
    };
}

export function computeSellSolOut(
    virtualSolReserves: BN,
    virtualTokenReserves: BN,
    tokensIn: BN,
): BN {
    if (tokensIn.lte(new BN(0)) || virtualTokenReserves.eq(new BN(0))) {
        return new BN(0);
    }

    const denominator = virtualTokenReserves.add(tokensIn);
    if (denominator.eq(new BN(0))) {
        return new BN(0);
    }

    return tokensIn.mul(virtualSolReserves).div(denominator);
}

/** Uses virtual_sol only (PumpFun-style; virtual_sol is updated on buy and when winner receives SOL). */
export function computeMarketCapLamports(params: {
    virtualSolReserves: BN;
    realSolReserves: BN;
    virtualTokenReserves: BN;
    tokenTotalSupply: BN;
}): BN {
    const { virtualSolReserves, virtualTokenReserves, tokenTotalSupply } = params;

    if (virtualTokenReserves.eq(new BN(0))) {
        return new BN(0);
    }

    const pricePerToken = virtualSolReserves.mul(ONE_BILLION).div(virtualTokenReserves);
    return pricePerToken.mul(tokenTotalSupply).div(ONE_BILLION);
}

/**
 * Post-trade market cap aligned with program's compute_market_cap_with_deltas.
 * Virtual SOL is updated on buy (increases) and on sell (decreases); use newVirtualSol and newVirtualToken.
 */
export function computePostTradeMarketCap(params: {
    virtualSolReserves: BN;
    realSolReserves: BN;
    virtualTokenReserves: BN;
    tokenTotalSupply: BN;
    isBuy: boolean;
    solDelta: BN;
    tokenDelta: BN;
}): BN {
    const { virtualSolReserves, virtualTokenReserves, tokenTotalSupply, isBuy, solDelta, tokenDelta } = params;

    const newVirtualSol = isBuy
        ? virtualSolReserves.add(solDelta)
        : virtualSolReserves.sub(solDelta);
    const newVirtualToken = isBuy
        ? virtualTokenReserves.sub(tokenDelta)
        : virtualTokenReserves.add(tokenDelta);

    if (newVirtualToken.lte(new BN(0))) {
        return new BN(0);
    }

    return tokenTotalSupply.mul(newVirtualSol).div(newVirtualToken);
}
