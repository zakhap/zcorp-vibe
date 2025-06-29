'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'wagmi/chains';

// WETH contract address on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const;

// WETH ABI - only need the deposit function
const WETH_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
] as const;

interface WETHWrapperProps {
  onSuccess?: () => void;
  children: React.ReactNode;
  amount?: string;
}

export function WETHWrapper({ onSuccess, children, amount = '0.01' }: WETHWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle successful transaction
  if (isSuccess && hash && !isLoading) {
    console.log('✅ WETH wrap successful:', hash);
    onSuccess?.();
  }

  const handleWrapETH = async () => {
    try {
      setIsLoading(true);
      
      writeContract({
        address: WETH_ADDRESS,
        abi: WETH_ABI,
        functionName: 'deposit',
        value: parseEther(amount),
        chainId: base.id,
      });
    } catch (err) {
      console.error('❌ Failed to wrap ETH:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonState = () => {
    if (isPending) return { text: 'Confirm in wallet...', disabled: true };
    if (isConfirming) return { text: 'Wrapping...', disabled: true };
    if (isSuccess) return { text: '✅ Wrapped!', disabled: true };
    if (isLoading) return { text: 'Preparing...', disabled: true };
    return { text: `Wrap ${amount} ETH`, disabled: false };
  };

  const buttonState = getButtonState();

  return (
    <div className="space-y-3">
      <button
        onClick={handleWrapETH}
        disabled={buttonState.disabled}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {buttonState.text}
      </button>
      
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          Error: {error.message}
        </div>
      )}
      
      {hash && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
          <div>Transaction submitted!</div>
          <a 
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-green-800"
          >
            View on BaseScan →
          </a>
        </div>
      )}
      
      {/* Fallback link */}
      <div className="text-center">
        <span className="text-xs text-gray-500">or</span>
      </div>
      
      {children}
    </div>
  );
}