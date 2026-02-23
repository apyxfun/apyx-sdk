import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { UserPositionData } from "../types";

/**
 * UserPosition - per user per bonding curve (SOL contributed, auto-claim settings)
 */
export class UserPositionAccount implements UserPositionData {
    public user: PublicKey;
    public duel: PublicKey;
    public solContributed: BN;
    public curveSolAtUpdate: BN;
    public lastUpdated: BN;
    public bump: number;
    public autoClaimEnabled: boolean;
    public delegatedWorker: PublicKey;

    constructor(data: UserPositionData) {
        this.user = data.user;
        this.duel = data.duel;
        this.solContributed = new BN(data.solContributed);
        this.curveSolAtUpdate = new BN(data.curveSolAtUpdate);
        this.lastUpdated = new BN(data.lastUpdated);
        this.bump = data.bump;
        this.autoClaimEnabled = data.autoClaimEnabled;
        this.delegatedWorker = data.delegatedWorker;
    }

    /** Map from program account (camelCase or snake_case) */
    static fromProgramAccount(account: any): UserPositionAccount {
        return new UserPositionAccount({
            user: new PublicKey(account.user),
            duel: new PublicKey(account.duel),
            solContributed: account.solContributed ?? account.sol_contributed,
            curveSolAtUpdate: account.curveSolAtUpdate ?? account.curve_sol_at_update,
            lastUpdated: account.lastUpdated ?? account.last_updated,
            bump: account.bump ?? 0,
            autoClaimEnabled: account.autoClaimEnabled ?? account.auto_claim_enabled ?? false,
            delegatedWorker: new PublicKey(account.delegatedWorker ?? account.delegated_worker ?? "11111111111111111111111111111111"),
        });
    }
}
