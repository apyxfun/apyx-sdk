# @apyxfun/sdk

TypeScript SDK for interacting with the Apyx on-chain program.

## Installation

```bash
npm install @apyxfun/sdk
```

## Quick Start

```typescript
import { ApyxClient, PROGRAM_ID } from '@apyxfun/sdk';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';

// Create provider
const connection = new Connection('https://api.devnet.solana.com');
const wallet = new Wallet(Keypair.generate());
const provider = new AnchorProvider(connection, wallet, {});

// Initialize client
const client = new ApyxClient(provider);

// Get token info
const tokenInfo = await client.getTokenInfo(new PublicKey('...'));
console.log('Market Cap:', tokenInfo.marketCap);
```

## API

### Instructions

- `launchToken(user, params)` - Launch a new token with bonding curve
- `buy(user, params)` - Buy tokens with SOL
- `sell(user, params)` - Sell tokens for SOL

### Account Fetchers

- `getBondingCurve(mint)` - Get bonding curve data
- `getConfig()` - Get program configuration
- `getDuel(pda)` - Get duel matchmaking data
- `getTokenInfo(mint)` - Get comprehensive token info

### Helper Functions

```typescript
import { 
  deriveBondingCurvePda, 
  deriveMatchKey, 
  mcapToBucket,
  calculateBuyQuote,
  calculateSellQuote,
  getMarketCap,
} from '@apyxfun/sdk';
```

### Events

```typescript
client.addEventListener('launchTokenEvent', (event, slot, sig) => {
  console.log('Token launched:', event.mint.toString());
});

client.addEventListener('tradeEvent', (event, slot, sig) => {
  console.log('Trade:', event.isBuy ? 'BUY' : 'SELL');
});
```

## License

MIT
