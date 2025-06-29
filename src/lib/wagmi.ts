import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

const chains = [base] as const;

// Validate required environment variables
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const isValidProjectId = walletConnectProjectId && 
  walletConnectProjectId !== 'demo123456789' && 
  walletConnectProjectId.length >= 32;

if (!isValidProjectId) {
  console.warn('⚠️  WalletConnect Project ID is missing or invalid. WalletConnect will be disabled.');
  console.warn('   Get a real Project ID from https://cloud.walletconnect.com');
}

// Create connectors array conditionally
const connectors = [
  injected(),
  coinbaseWallet({
    appName: 'ZCORP Token Launcher',
    appLogoUrl: 'https://via.placeholder.com/64x64.png?text=Z',
  }),
];

// Only add WalletConnect if we have a valid project ID
if (isValidProjectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId!,
      metadata: {
        name: 'ZCORP Token Launcher',
        description: 'Deploy tokens as ZCORP - Token gated by ZCORP holders',
        url: 'http://localhost:3000',
        icons: ['https://via.placeholder.com/64x64.png?text=Z'],
      },
    })
  );
}

// Create wagmi config without SSR
export const config = createConfig({
  chains,
  connectors,
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  ssr: false, // Explicitly disable SSR
});

export { chains };