import { PublicKey } from "@solana/web3.js";
import { struct, u8, u16, u64, u128, publicKey } from "@coral-xyz/borsh";
import { BN } from "@coral-xyz/anchor";
import { ConfigData } from "../types";

/**
 * ConfigAccount - parsed program config data
 */
export class ConfigAccount implements ConfigData {
    public admin: PublicKey;
    public protocolFeeVault: PublicKey;
    public protocolFeeBps: number;
    public creatorFeeBps: number;
    /** Target mcap growth in bps (e.g. 11000 = 110%) */
    public targetMcapGrowthBps: number;
    public graduateTokens: boolean;
    public graduationFeeLamports: BN;
    public initialVirtualSolReserves: BN;
    public initialVirtualTokenReserves: BN;
    public initialRealTokenReserves: BN;
    public totalSupply: BN;
    public windowSizeSlots: BN;
    public matchKeySpace: number;
    public cooldownSlots: BN;
    public delegatedClaimAuthority: PublicKey;
    public delegatedResolveAuthority: PublicKey;
    /** Mercy discount multiplier in bps (e.g. 10000 = 1.0, 11000 = 1.1). 0 treated as 10000. */
    public mercyDiscountMultiplierBps: number;

    constructor(data: ConfigData) {
        this.admin = data.admin;
        this.protocolFeeVault = data.protocolFeeVault;
        this.protocolFeeBps = data.protocolFeeBps;
        this.creatorFeeBps = data.creatorFeeBps;
        this.targetMcapGrowthBps = data.targetMcapGrowthBps;
        this.graduateTokens = data.graduateTokens;
        this.graduationFeeLamports = data.graduationFeeLamports;
        this.initialVirtualSolReserves = data.initialVirtualSolReserves;
        this.initialVirtualTokenReserves = data.initialVirtualTokenReserves;
        this.initialRealTokenReserves = data.initialRealTokenReserves;
        this.totalSupply = data.totalSupply;
        this.windowSizeSlots = data.windowSizeSlots;
        this.matchKeySpace = data.matchKeySpace;
        this.cooldownSlots = data.cooldownSlots;
        this.delegatedClaimAuthority = data.delegatedClaimAuthority;
        this.delegatedResolveAuthority = (data as any).delegatedResolveAuthority ?? data.delegatedClaimAuthority;
        this.mercyDiscountMultiplierBps = (data as any).mercyDiscountMultiplierBps ?? (data as any).mercy_discount_multiplier_bps ?? 10000;
    }

    /**
     * Get total fee basis points
     */
    getTotalFeeBps(): number {
        return this.protocolFeeBps + this.creatorFeeBps;
    }

    /**
     * Parse from raw account data buffer
     */
    static fromBuffer(buffer: Buffer): ConfigAccount {
        // Skip discriminator (8 bytes)
        const data = buffer.slice(8);

        const structure = struct([
            publicKey("admin"),
            publicKey("protocolFeeVault"),
            u16("protocolFeeBps"),
            u16("creatorFeeBps"),
            u16("targetMcapGrowthBps"),
            u8("graduateTokens"), // bool as u8
            u64("graduationFeeLamports"),
            u64("initialVirtualSolReserves"),
            u128("initialVirtualTokenReserves"),
            u128("initialRealTokenReserves"),
            u128("totalSupply"),
            u64("windowSizeSlots"),
            u16("matchKeySpace"),
            u64("cooldownSlots"),
            publicKey("delegatedClaimAuthority"),
            publicKey("delegatedResolveAuthority"),
            u16("mercyDiscountMultiplierBps"),
        ]);

        const value = structure.decode(data);

        return new ConfigAccount({
            admin: new PublicKey(value.admin),
            protocolFeeVault: new PublicKey(value.protocolFeeVault),
            protocolFeeBps: value.protocolFeeBps,
            creatorFeeBps: value.creatorFeeBps,
            targetMcapGrowthBps: value.targetMcapGrowthBps,
            graduateTokens: Boolean(value.graduateTokens),
            graduationFeeLamports: new BN(value.graduationFeeLamports.toString()),
            initialVirtualSolReserves: new BN(value.initialVirtualSolReserves.toString()),
            initialVirtualTokenReserves: new BN(value.initialVirtualTokenReserves.toString()),
            initialRealTokenReserves: new BN(value.initialRealTokenReserves.toString()),
            totalSupply: new BN(value.totalSupply.toString()),
            windowSizeSlots: new BN(value.windowSizeSlots.toString()),
            matchKeySpace: value.matchKeySpace,
            cooldownSlots: new BN(value.cooldownSlots.toString()),
            delegatedClaimAuthority: new PublicKey(value.delegatedClaimAuthority),
            delegatedResolveAuthority: new PublicKey(value.delegatedResolveAuthority ?? value.delegatedClaimAuthority),
            mercyDiscountMultiplierBps: value.mercyDiscountMultiplierBps ?? value.mercy_discount_multiplier_bps ?? 10000,
        });
    }
}
