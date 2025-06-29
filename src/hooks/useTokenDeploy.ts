'use client';

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const { signMessageAsync } = useSignMessage();
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const createMessage = (tokenConfig: TokenConfig, timestamp: number) => {
    return JSON.stringify({
      action: 'deploy_token_as_zcorp',
      config: tokenConfig,
      timestamp,
      userAddress: address,
    });
  };

  const simulateDeployment = async (tokenConfig: TokenConfig) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsSimulating(true);
    
    try {
      const response = await fetch(`${API_URL}/api/deploy/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenConfig,
          userAddress: address,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Simulation failed');
      }

      return result;
    } finally {
      setIsSimulating(false);
    }
  };

  const deployToken = async (tokenConfig: TokenConfig): Promise<DeploymentResult> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsDeploying(true);

    try {
      // Create timestamp and message
      const timestamp = Math.floor(Date.now() / 1000);
      const message = createMessage(tokenConfig, timestamp);

      // Sign the message
      const signature = await signMessageAsync({ message });

      // Send deployment request
      const response = await fetch(`${API_URL}/api/deploy/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenConfig,
          signature,
          userAddress: address,
          timestamp,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Deployment failed',
        };
      }

      return {
        success: true,
        deploymentId: result.deploymentId,
        tokenAddress: result.tokenAddress,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
      };

    } catch (error) {
      console.error('Deployment error:', error);
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
    simulateDeployment,
    isDeploying,
    isSimulating,
  };
}