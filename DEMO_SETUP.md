# 🚀 ZCORP Token Launcher - Demo Setup Guide

## Quick Demo Setup (Using WETH for Testing)

This guide will help you get the ZCORP Token Launcher running in demo mode using WETH instead of ZCORP tokens.

### 1. Install Dependencies

```bash
cd /Users/z/Documents/github/zcorp
rm -rf node_modules package-lock.json  # Clean install
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```bash
# Required - Add your private key
ZCORP_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Required - Get from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Pre-configured for demo (WETH on Base)
ZCORP_TOKEN_ADDRESS=0x4200000000000000000000000000000000000006
NEXT_PUBLIC_ZCORP_TOKEN_ADDRESS=0x4200000000000000000000000000000000000006
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
NEXT_PUBLIC_CHAIN_ID=8453
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3001
```

### 3. Get Test WETH

To test the platform, you need at least **0.01 WETH** on Base:

#### Option A: Wrap ETH on Uniswap
1. Go to [Uniswap](https://app.uniswap.org)
2. Connect your wallet to Base network
3. Swap ETH → WETH (minimum 0.01 ETH)

#### Option B: Use Base DEXs
- [Aerodrome](https://aerodrome.finance)
- [BaseSwap](https://baseswap.fi)
- [SushiSwap](https://www.sushi.com)

### 4. Run the Application

```bash
npm run dev:full
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

### 5. Test the Flow

1. **Connect Wallet**: Click "Connect Wallet" and connect your wallet with WETH
2. **Verify Balance**: The app will check your WETH balance (need ≥ 0.01 WETH)
3. **Configure Token**: Fill out the token deployment form
4. **Deploy**: Sign the transaction and deploy your token

### Demo Features

✅ **Token Gating**: Only wallets with ≥ 0.01 WETH can deploy  
✅ **V4 Clanker Integration**: Uses latest Clanker protocol  
✅ **Custom Quote Tokens**: Tokens are denominated in WETH  
✅ **User Dashboard**: Track your deployed tokens  
✅ **Advanced Features**: Vaults, airdrops, custom fees  

### Troubleshooting

#### "Insufficient WETH Balance"
- Make sure you have at least 0.01 WETH on Base network
- Check you're connected to the correct network (Base, Chain ID 8453)

#### "Deployment Failed"
- Ensure your deployment wallet has ETH for gas fees
- Check that your private key is correctly set in `.env`
- Verify the RPC URL is working

#### "ConnectKit Errors"
- Get a free Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
- Add it to `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env`

#### "Cannot Connect to Backend"
- Make sure both frontend and backend are running (`npm run dev:full`)
- Check that ports 3000 and 3001 are available

### API Endpoints

- `GET /health` - Backend health check
- `GET /api/auth/verify-balance/:address` - Check WETH balance
- `POST /api/deploy/token` - Deploy new token
- `GET /api/tokens/deployments/:userAddress` - Get deployment history

### Production Setup

To use real ZCORP tokens instead of WETH:

1. Replace `ZCORP_TOKEN_ADDRESS` with your actual ZCORP token address
2. Update minimum balance requirements in the code
3. Deploy to production with secure private key management

### Support

- Check the main README.md for detailed documentation
- Review the product spec in ZCORP_LAUNCHER_SPEC.md
- Open an issue for bugs or questions