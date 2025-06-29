'use client';

import { useAccount, useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';

const ZCORP_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ZCORP_TOKEN_ADDRESS as `0x${string}`;

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export function useZCORPBalance() {
  const { address, isConnected } = useAccount();

  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance,
  } = useReadContract({
    address: ZCORP_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const {
    data: decimals,
    isLoading: isLoadingDecimals,
  } = useReadContract({
    address: ZCORP_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: base.id,
  });

  const {
    data: symbol,
    isLoading: isLoadingSymbol,
  } = useReadContract({
    address: ZCORP_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'symbol',
    chainId: base.id,
  });

  const isLoading = isLoadingBalance || isLoadingDecimals || isLoadingSymbol;

  // Calculate if user is qualified (has at least 0.01 WETH for demo)
  const minBalance = decimals ? BigInt(1) * BigInt(10) ** BigInt(decimals - 2) : BigInt(0); // 0.01 WETH
  const isQualified = balance ? balance >= minBalance : false;

  // Format balance for display
  const formattedBalance = balance && decimals 
    ? (Number(balance) / Number(BigInt(10) ** BigInt(decimals))).toFixed(4)
    : '0.0000';

  return {
    address,
    isConnected,
    balance: balance || BigInt(0),
    formattedBalance,
    decimals: decimals || 18,
    symbol: symbol || 'WETH',
    isQualified,
    minBalance,
    isLoading,
    error: balanceError,
    refetch: refetchBalance,
  };
}