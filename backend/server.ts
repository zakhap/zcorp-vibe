import express from 'express';
import cors from 'cors';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Clanker } from 'clanker-sdk';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Validate environment variables
const ZCORP_PRIVATE_KEY = process.env.ZCORP_PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';

if (!ZCORP_PRIVATE_KEY) {
  console.error('❌ ZCORP_PRIVATE_KEY is required');
  process.exit(1);
}

// Initialize ZCORP wallet
const account = privateKeyToAccount(ZCORP_PRIVATE_KEY);
const transport = http(RPC_URL);

const publicClient = createPublicClient({
  chain: base,
  transport,
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport,
});

// Initialize Clanker SDK
const clanker = new Clanker({
  wallet: walletClient,
  publicClient,
});

// Token config validation
const tokenConfigSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/),
  image: z.string().url(),
  description: z.string().max(500).optional(),
  pool: z.object({
    pairedToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    positions: z.enum(['Standard', 'Project']),
  }),
  vault: z.object({
    percentage: z.number().min(0).max(30),
    lockupDuration: z.number().min(0),
    vestingDuration: z.number().min(0),
  }).optional(),
  fees: z.union([
    z.enum(['DynamicBasic', 'StaticBasic']),
    z.object({})
  ]).optional(),
});

const deployTokenSchema = z.object({
  tokenConfig: tokenConfigSchema,
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// Deploy token endpoint
app.post('/api/deploy/token', async (req, res) => {
  try {
    const validationResult = deployTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: validationResult.error.errors,
      });
    }

    const { tokenConfig, userAddress } = validationResult.data;

    console.log(`🚀 Deploying token AS ZCORP for user ${userAddress}: ${tokenConfig.name} (${tokenConfig.symbol})`);

    // Deploy token using ZCORP's private key
    const tokenAddress = await clanker.deployToken({
      type: 'v4',
      name: tokenConfig.name,
      symbol: tokenConfig.symbol,
      tokenAdmin: account.address, // ZCORP is the admin
      image: tokenConfig.image,
      metadata: {
        description: tokenConfig.description || `${tokenConfig.name} token deployed as ZCORP`,
        socialMediaUrls: [],
        auditUrls: [],
      },
      context: {
        interface: 'ZCORP Token Launcher',
        platform: 'zcorp.demo',
        messageId: '',
        id: `zcorp-${Date.now()}`,
      },
      pool: {
        pairedToken: tokenConfig.pool.pairedToken,
        positions: tokenConfig.pool.positions === 'Project' ? 'Project' : 'Standard',
      },
      ...(tokenConfig.vault && { vault: tokenConfig.vault }),
      ...(tokenConfig.fees && { fees: tokenConfig.fees }),
      devBuy: {
        ethAmount: 0.001, // Small dev buy
      },
    });

    console.log(`✅ Token deployed successfully as ZCORP: ${tokenAddress}`);

    res.json({
      success: true,
      tokenAddress,
      explorerUrl: `https://basescan.org/token/${tokenAddress}`,
      deployedBy: account.address, // ZCORP address
      requestedBy: userAddress, // User who requested it
    });

  } catch (error) {
    console.error('❌ Deployment error:', error);
    res.status(500).json({
      error: 'Token deployment failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    zcorp: account.address,
    chain: base.name,
    rpc: RPC_URL,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ZCORP Backend Server running on port ${PORT}`);
  console.log(`🔐 ZCORP Address: ${account.address}`);
  console.log(`⛓️  Chain: ${base.name} (${base.id})`);
  console.log(`🌐 RPC: ${RPC_URL}`);
});