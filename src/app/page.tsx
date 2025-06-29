'use client';

import { ConnectButton } from '@/components/ConnectButton';
import { useZCORPBalance } from '@/hooks/useZCORPBalance';
import { TokenLaunchForm } from '@/components/TokenLaunchForm';
import { UserDashboard } from '@/components/UserDashboard';
import { ClientOnly } from '@/components/ClientOnly';
import { StatusBar, type ConnectionStatus } from '@/components/StatusBar';
import { DisabledOverlay } from '@/components/DisabledOverlay';
import { ChainInfo } from '@/components/ChainInfo';

// Loading component
function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ZCORP Token Launcher</h1>
              <p className="text-sm text-gray-600">Deploy tokens as ZCORP (Demo Mode - WETH)</p>
            </div>
          </div>
          <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ZCORP Token Launcher...</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main app component that uses wagmi
function MainApp() {
  const { address, isConnected, isQualified, formattedBalance, symbol, isLoading, error, refetch } = useZCORPBalance();

  // Determine connection status for StatusBar
  const getConnectionStatus = (): ConnectionStatus => {
    if (error) return 'error';
    if (!isConnected) return 'disconnected';
    if (isLoading) return 'connected-loading';
    if (!isQualified) return 'connected-unqualified';
    return 'connected-qualified';
  };

  const connectionStatus = getConnectionStatus();
  const isFormDisabled = !isConnected || !isQualified;
  const isDashboardLimited = !isConnected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ZCORP Token Launcher</h1>
              <p className="text-sm text-gray-600">Deploy tokens as ZCORP (Demo Mode - WETH)</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ChainInfo />
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to ZCORP Token Launcher
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            A token-gated platform for ZCORP holders to deploy new tokens with the power and branding of ZCORP.
          </p>
        </div>

        {/* Dynamic Status Bar */}
        <StatusBar 
          status={connectionStatus}
          balance={formattedBalance}
          symbol={symbol}
          minRequired="0.01"
          error={error?.message}
          onRetry={refetch}
          address={address}
        />

        {/* Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Demo Mode Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">🚀</span>
              Demo Mode
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              This demo uses WETH (Wrapped Ethereum) on Base instead of ZCORP tokens. 
              You need at least 0.01 WETH to test the platform.
            </p>
            <a 
              href="https://app.uniswap.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-700 hover:text-blue-900 text-sm font-medium underline"
            >
              Get WETH on Uniswap →
            </a>
          </div>

          {/* How It Works */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">1</span>
                <span>Connect wallet & verify WETH balance</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">2</span>
                <span>Configure token parameters</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">3</span>
                <span>Sign & deploy as ZCORP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Always Visible */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Launch Form */}
          <div className="lg:col-span-2">
            <DisabledOverlay
              isDisabled={isFormDisabled}
              reason={
                !isConnected 
                  ? "Connect your wallet to start deploying tokens"
                  : !isQualified 
                    ? `You need at least 0.01 ${symbol} to deploy tokens`
                    : "Form is currently unavailable"
              }
              action={
                !isConnected 
                  ? undefined
                  : !isQualified 
                    ? { text: 'Get WETH', href: 'https://app.uniswap.org' }
                    : undefined
              }
            >
              <TokenLaunchForm />
            </DisabledOverlay>
          </div>

          {/* User Dashboard */}
          <div className="lg:col-span-1">
            <UserDashboard 
              isLimited={isDashboardLimited}
              address={address}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>&copy; 2024 ZCORP Token Launcher. Powered by Clanker SDK.</p>
        </div>
      </footer>
    </div>
  );
}

// Export wrapped component
export default function Home() {
  return (
    <ClientOnly fallback={<LoadingPage />}>
      <MainApp />
    </ClientOnly>
  );
}
