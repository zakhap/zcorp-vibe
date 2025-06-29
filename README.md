# ZCORP Token Launcher

A token-gated platform that allows ZCORP token holders to deploy new tokens "as ZCORP" using the Clanker SDK.

## Features

- 🎯 **Token Gating**: Only ZCORP token holders can deploy tokens
- 🚀 **V4 Clanker Integration**: Latest protocol with maximum flexibility  
- 💰 **Custom Quote Tokens**: Deploy tokens denominated in ZCORP or other currencies
- 🔐 **Signature Authentication**: Secure deployment authorization
- 📊 **User Dashboard**: Track deployment history and statistics
- 🛠️ **Advanced Features**: Vaults, airdrops, custom fees

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Web3**: Wagmi, Viem, ConnectKit
- **Backend**: Express.js, SQLite
- **Blockchain**: Clanker SDK for token deployment on Base

## Quick Start

### 1. Clone and Install

```bash
git clone <repository>
cd zcorp
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Backend
ZCORP_PRIVATE_KEY=0x...        # ZCORP deployment wallet
ZCORP_TOKEN_ADDRESS=0x4200000000000000000000000000000000000006  # WETH on Base (demo)
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
PORT=3001

# Frontend  
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ZCORP_TOKEN_ADDRESS=0x4200000000000000000000000000000000000006  # WETH on Base (demo)
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...  # Get from https://cloud.walletconnect.com
```

**Demo Mode**: The app is configured to use WETH (Wrapped ETH) instead of ZCORP tokens for easy testing. Users need 0.01 WETH minimum to deploy tokens.

### 3. Run Development Servers

```bash
# Run both frontend and backend
npm run dev:full

# Or run separately:
npm run backend    # Backend on :3001
npm run dev        # Frontend on :3000
```

## Architecture

### Token Gating Flow

1. **Connect Wallet**: User connects MetaMask/WalletConnect
2. **Verify Balance**: Check ZCORP token ownership (minimum 1 token)
3. **Configure Token**: Fill out deployment form
4. **Sign Request**: User signs deployment configuration
5. **Deploy**: Backend verifies signature and deploys via Clanker SDK

### Backend Services

- **AuthService**: Signature verification and ZCORP balance checking
- **ClankerService**: Token deployment using Clanker SDK
- **Database**: SQLite for deployment tracking

### Frontend Components

- **TokenLaunchForm**: Main deployment interface
- **UserDashboard**: Deployment history and statistics
- **Web3Provider**: Wallet connection and Web3 state

## Development

### Project Structure

```
├── backend/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── database/        # SQLite setup
├── src/
│   ├── app/            # Next.js pages
│   ├── components/     # React components  
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities
│   └── providers/      # Context providers
```

### Key Commands

```bash
npm run dev:full        # Full development environment
npm run backend         # Backend only
npm run dev            # Frontend only
npm run lint           # Lint code
npm run build          # Build for production
```

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Add components in `src/components/`
3. **Hooks**: Add custom hooks in `src/hooks/`
4. **Database**: Modify schema in `backend/database/init.ts`

## Deployment

### Backend Deployment

1. Set production environment variables
2. Update database to PostgreSQL for production
3. Deploy to your preferred platform (Railway, Render, etc.)

### Frontend Deployment

1. Update `NEXT_PUBLIC_API_URL` to production backend
2. Deploy to Vercel, Netlify, or similar
3. Configure custom domain

## API Endpoints

### Authentication
- `GET /api/auth/verify-balance/:address` - Check ZCORP balance
- `POST /api/auth/verify-signature` - Verify user signature

### Deployment
- `POST /api/deploy/token` - Deploy new token
- `POST /api/deploy/simulate` - Simulate deployment

### Tokens
- `GET /api/tokens/deployments/:userAddress` - Get user deployments
- `GET /api/tokens/stats/:userAddress` - Get user statistics

## Security Considerations

- Private keys secured via environment variables
- Signature verification prevents unauthorized deployments
- Rate limiting on deployment endpoints
- Input validation and sanitization
- CORS configuration for production

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in the spec file
- Review Clanker SDK documentation
