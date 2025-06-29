'use client';

import { useConnect, useAccount, useDisconnect } from 'wagmi';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Find WalletConnect connector
  const walletConnectConnector = connectors.find(connector => 
    connector.name === 'WalletConnect'
  );

  const handleConnect = () => {
    if (walletConnectConnector) {
      connect({ connector: walletConnectConnector });
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isPending || !walletConnectConnector}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}