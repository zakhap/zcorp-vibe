'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export interface TokenConfig {
  name: string;
  symbol: string;
  image: string;
  description?: string;
  pool: {
    pairedToken: string;
    positions: 'Standard' | 'Project';
  };
  vault?: {
    percentage: number;
    lockupDuration: number;
    vestingDuration: number;
  };
  airdrop?: {
    merkleRoot: string;
    amount: number;
    lockupDuration: number;
    vestingDuration: number;
  };
  fees?: 'DynamicBasic' | 'StaticBasic' | object;
}

export interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  tokenAddress?: string;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

export function useTokenDeploy() {
  const { address } = useAccount();
  const [isDeploying, setIsDeploying] = useState(false);

  const deployToken = async (tokenConfig: TokenConfig): Promise<DeploymentResult> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsDeploying(true);

    try {
      console.log('🚀 Requesting token deployment as ZCORP:', tokenConfig.name, tokenConfig.symbol);

      // Send deployment request to backend
      const response = await fetch(`${API_URL}/api/deploy/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenConfig,
          userAddress: address,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Deployment failed',
        };
      }

      console.log('✅ Token deployed successfully as ZCORP:', result.tokenAddress);

      return {
        success: true,
        tokenAddress: result.tokenAddress,
        explorerUrl: result.explorerUrl,
      };

    } catch (error) {
      console.error('❌ Deployment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      setIsDeploying(false);
    }
  };

  return {
    deployToken,
    isDeploying,
  };
}