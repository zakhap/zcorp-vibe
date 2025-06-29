'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

export function ChainInfo() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return null;
  }

  const isCorrectChain = chainId === base.id; // Base = 8453

  const getChainName = (id: number) => {
    switch (id) {
      case 1: return 'Ethereum Mainnet';
      case 8453: return 'Base';
      case 11155111: return 'Sepolia Testnet';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum One';
      case 10: return 'Optimism';
      default: return `Chain ${id}`;
    }
  };

  if (isCorrectChain) {
    return (
      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
        ✅ Connected to {getChainName(chainId)}
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-orange-900">
            ⚠️ Wrong Network
          </div>
          <div className="text-xs text-orange-800">
            Connected to: {getChainName(chainId)} • Need: Base (8453)
          </div>
        </div>
        <button
          onClick={() => switchChain({ chainId: base.id })}
          disabled={isPending}
          className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 disabled:opacity-50"
        >
          {isPending ? 'Switching...' : 'Switch to Base'}
        </button>
      </div>
    </div>
  );
}