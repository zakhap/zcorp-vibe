import dotenv from 'dotenv';
import { verifyMessage } from 'viem';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Load environment variables
dotenv.config();

const ZCORP_TOKEN_ADDRESS = process.env.ZCORP_TOKEN_ADDRESS as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';

if (!ZCORP_TOKEN_ADDRESS) {
  throw new Error('ZCORP_TOKEN_ADDRESS environment variable is required');
}

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

// ERC20 ABI for balanceOf
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
] as const;

export interface VerificationRequest {
  userAddress: `0x${string}`;
  signature: `0x${string}`;
  message: string;
  timestamp: number;
}

export class AuthService {
  private usedNonces = new Set<string>();
  private readonly MAX_NONCE_AGE = 600; // 10 minutes
  private readonly REQUEST_MAX_AGE = 300; // 5 minutes

  // Clean up old nonces periodically
  private cleanupNonces() {
    // This is a simple implementation. In production, use Redis or database
    const cutoff = Date.now() - (this.MAX_NONCE_AGE * 1000);
    for (const nonce of this.usedNonces) {
      const [timestamp] = nonce.split('-');
      if (parseInt(timestamp) < cutoff) {
        this.usedNonces.delete(nonce);
      }
    }
  }

  async verifyZCORPHolder(request: VerificationRequest) {
    try {
      // 1. Verify timestamp (prevent replay attacks)
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (currentTime - request.timestamp > this.REQUEST_MAX_AGE) {
        throw new Error('Request expired. Please try again.');
      }

      if (request.timestamp > currentTime + 60) {
        throw new Error('Request timestamp is in the future.');
      }

      // 2. Create and check nonce (prevent replay attacks)
      const nonce = `${request.timestamp}-${request.userAddress}-${request.message.slice(0, 32)}`;
      if (this.usedNonces.has(nonce)) {
        throw new Error('Request already processed. Please create a new request.');
      }

      this.usedNonces.add(nonce);
      this.cleanupNonces();

      // 2. Verify signature
      const isValidSignature = await verifyMessage({
        address: request.userAddress,
        message: request.message,
        signature: request.signature,
      });

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // 3. Check ZCORP token balance
      const balance = await publicClient.readContract({
        address: ZCORP_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [request.userAddress],
      });

      const decimals = await publicClient.readContract({
        address: ZCORP_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'decimals',
        args: [],
      });

      const minBalance = BigInt(1) * BigInt(10) ** BigInt(decimals - 2); // Minimum 0.01 WETH for demo

      if (balance < minBalance) {
        throw new Error('Insufficient WETH balance. You need at least 0.01 WETH to deploy tokens in demo mode.');
      }

      return {
        success: true,
        userAddress: request.userAddress,
        balance: balance.toString(),
        decimals: decimals,
        isQualified: true,
      };

    } catch (error) {
      console.error('❌ ZCORP verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        isQualified: false,
      };
    }
  }

  async checkZCORPBalance(userAddress: `0x${string}`) {
    try {
      const balance = await publicClient.readContract({
        address: ZCORP_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      });

      const decimals = await publicClient.readContract({
        address: ZCORP_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'decimals',
        args: [],
      });

      const minBalance = BigInt(1) * BigInt(10) ** BigInt(decimals - 2); // 0.01 WETH for demo

      return {
        balance: balance.toString(),
        decimals: decimals,
        isQualified: balance >= minBalance,
        minRequired: minBalance.toString(),
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      console.error('❌ Balance check failed:', error);
      throw new Error('Failed to check ZCORP balance');
    }
  }

  createDeploymentMessage(tokenConfig: any, userAddress: string, timestamp: number) {
    return JSON.stringify({
      action: 'deploy_token_as_zcorp',
      config: tokenConfig,
      timestamp,
      userAddress,
    });
  }

  validateMessageFormat(message: string, tokenConfig: any, userAddress: string) {
    try {
      const parsed = JSON.parse(message);
      
      return (
        parsed.action === 'deploy_token_as_zcorp' &&
        parsed.userAddress === userAddress &&
        typeof parsed.timestamp === 'number' &&
        parsed.config &&
        parsed.config.name === tokenConfig.name &&
        parsed.config.symbol === tokenConfig.symbol
      );
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();