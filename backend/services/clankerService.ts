import dotenv from 'dotenv';
import { Clanker } from 'clanker-sdk';
import { createPublicClient, createWalletClient, http, type PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import type { ClankerTokenV4 } from 'clanker-sdk/config/clankerTokenV4';

// Load environment variables
dotenv.config();

// Environment variables
const PRIVATE_KEY = process.env.ZCORP_PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';

if (!PRIVATE_KEY) {
  throw new Error('ZCORP_PRIVATE_KEY environment variable is required');
}

// Initialize ZCORP wallet
const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
}) as PublicClient;

const wallet = createWalletClient({
  account,
  chain: base,
  transport: http(RPC_URL),
});

// Initialize Clanker SDK
const clanker = new Clanker({
  wallet,
  publicClient,
});

export interface TokenDeploymentConfig {
  name: string;
  symbol: string;
  image: string;
  description?: string;
  pool: {
    pairedToken: string; // ZCORP token address
    positions: 'Standard' | 'Project';
  };
  vault?: {
    percentage: number; // 0-30
    lockupDuration: number; // seconds
    vestingDuration: number; // seconds
  };
  airdrop?: {
    merkleRoot: string;
    amount: number;
    lockupDuration: number;
    vestingDuration: number;
  };
  fees?: 'DynamicBasic' | 'StaticBasic' | object;
  deployedBy: string; // User address for context
}

export class ClankerService {
  async deployToken(config: TokenDeploymentConfig) {
    try {
      console.log('🚀 Starting token deployment:', config.name);
      
      // Convert to Clanker V4 format
      const tokenConfig: ClankerTokenV4 = {
        type: 'v4',
        name: config.name,
        symbol: config.symbol,
        image: config.image,
        tokenAdmin: account.address, // ZCORP controls the token
        metadata: {
          description: config.description || '',
        },
        context: {
          interface: 'ZCORP Token Launcher',
          platform: 'ZCORP',
          messageId: `deployed-by-${config.deployedBy}`,
          id: config.deployedBy,
        },
        pool: {
          pairedToken: config.pool.pairedToken,
          positions: config.pool.positions === 'Standard' ? 'Standard' : 'Project',
        },
        vault: config.vault ? {
          percentage: config.vault.percentage,
          lockupDuration: config.vault.lockupDuration,
          vestingDuration: config.vault.vestingDuration,
        } : undefined,
        airdrop: config.airdrop ? {
          merkleRoot: config.airdrop.merkleRoot as `0x${string}`,
          amount: config.airdrop.amount,
          lockupDuration: config.airdrop.lockupDuration,
          vestingDuration: config.airdrop.vestingDuration,
        } : undefined,
        fees: config.fees || 'DynamicBasic',
        devBuy: {
          ethAmount: 0, // No initial buy by default
        },
        rewards: {
          recipients: [
            {
              recipient: account.address,
              admin: account.address,
              bps: 10000, // 100% to ZCORP
            },
          ],
        },
        vanity: true,
      };

      // Deploy token
      const { txHash, waitForTransaction, error } = await clanker.deployToken(tokenConfig);
      
      if (error) {
        throw new Error(`Deployment failed: ${error}`);
      }

      console.log('📝 Transaction submitted:', txHash);

      // Wait for transaction confirmation
      const { address: tokenAddress } = await waitForTransaction();

      console.log('✅ Token deployed successfully:', tokenAddress);

      return {
        success: true,
        tokenAddress,
        txHash,
        explorerUrl: `https://basescan.org/token/${tokenAddress}`,
      };

    } catch (error) {
      console.error('❌ Token deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async simulateDeployment(config: TokenDeploymentConfig) {
    try {
      // Similar to deployToken but using simulateDeployToken
      const tokenConfig: ClankerTokenV4 = {
        type: 'v4',
        name: config.name,
        symbol: config.symbol,
        image: config.image,
        tokenAdmin: account.address,
        metadata: {
          description: config.description || '',
        },
        context: {
          interface: 'ZCORP Token Launcher',
          platform: 'ZCORP',
          messageId: `simulation-${config.deployedBy}`,
          id: config.deployedBy,
        },
        pool: {
          pairedToken: config.pool.pairedToken,
          positions: config.pool.positions === 'Standard' ? 'Standard' : 'Project',
        },
        vault: config.vault,
        airdrop: config.airdrop ? {
          merkleRoot: config.airdrop.merkleRoot as `0x${string}`,
          amount: config.airdrop.amount,
          lockupDuration: config.airdrop.lockupDuration,
          vestingDuration: config.airdrop.vestingDuration,
        } : undefined,
        fees: config.fees || 'DynamicBasic',
        devBuy: {
          ethAmount: 0,
        },
        rewards: {
          recipients: [
            {
              recipient: account.address,
              admin: account.address,
              bps: 10000,
            },
          ],
        },
        vanity: true,
      };

      const { result, error } = await clanker.simulateDeployToken(tokenConfig);

      if (error) {
        throw new Error(`Simulation failed: ${error}`);
      }

      return {
        success: true,
        estimatedAddress: result,
        gasEstimate: 'TBD', // Would need to implement gas estimation
      };

    } catch (error) {
      console.error('❌ Simulation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Simulation failed',
      };
    }
  }

  getZCORPWalletAddress() {
    return account.address;
  }
}

export const clankerService = new ClankerService();