import express from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { authService } from '../services/authService';
import { clankerService } from '../services/clankerService';
import { dbService } from '../database/connection';

const router = express.Router();

// Input validation schemas
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
  airdrop: z.object({
    merkleRoot: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    amount: z.number().min(0),
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
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  timestamp: z.number(),
});

interface DeployTokenRequest extends z.infer<typeof deployTokenSchema> {}

// Deploy a new token
router.post('/token', async (req, res) => {
  try {
    // Input validation
    const validationResult = deployTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: validationResult.error.errors,
      });
    }

    const { tokenConfig, signature, userAddress, timestamp } = validationResult.data;

    // Zod validation already ensures required fields exist

    // Create message for verification
    const message = authService.createDeploymentMessage(tokenConfig, userAddress, timestamp);

    // Verify signature and ZCORP balance
    const verification = await authService.verifyZCORPHolder({
      userAddress,
      signature,
      message,
      timestamp,
    });

    if (!verification.success) {
      return res.status(401).json({
        error: 'Authentication failed',
        details: verification.error,
      });
    }

    // Validate message format
    if (!authService.validateMessageFormat(message, tokenConfig, userAddress)) {
      return res.status(400).json({
        error: 'Invalid message format',
      });
    }

    console.log(`🚀 Starting deployment for user ${userAddress}: ${tokenConfig.name} (${tokenConfig.symbol})`);

    // Deploy token using Clanker SDK
    const deploymentResult = await clankerService.deployToken({
      ...tokenConfig,
      deployedBy: userAddress,
    });

    if (!deploymentResult.success) {
      return res.status(500).json({
        error: 'Token deployment failed',
        details: deploymentResult.error,
      });
    }

    // Use database transaction for atomic operations
    const deploymentId = randomUUID();
    
    // Store deployment and update user session in transaction
    await dbService.transaction(async () => {
      // Store deployment record
      await dbService.run(
        `INSERT INTO deployments (id, token_address, deployed_by, tx_hash, token_config, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          deploymentId,
          deploymentResult.tokenAddress,
          userAddress,
          deploymentResult.txHash,
          JSON.stringify(tokenConfig),
          'completed'
        ]
      );

      // Update user deployment count
      await dbService.run(
        `INSERT OR REPLACE INTO user_sessions (user_address, zcorp_balance, last_verified, deployment_count)
         VALUES (?, ?, datetime('now'), COALESCE((SELECT deployment_count FROM user_sessions WHERE user_address = ?), 0) + 1)`,
        [userAddress, verification.balance, userAddress]
      );

      console.log(`✅ Deployment recorded: ${deploymentId}`);
    });

    res.json({
      success: true,
      deploymentId,
      tokenAddress: deploymentResult.tokenAddress,
      txHash: deploymentResult.txHash,
      explorerUrl: deploymentResult.explorerUrl,
    });

  } catch (error) {
    console.error('❌ Deployment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Input validation for simulation
const simulateSchema = z.object({
  tokenConfig: tokenConfigSchema,
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// Simulate token deployment (for gas estimation and validation)
router.post('/simulate', async (req, res) => {
  try {
    // Input validation
    const validationResult = simulateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: validationResult.error.errors,
      });
    }

    const { tokenConfig, userAddress } = validationResult.data;

    // Check ZCORP balance (without signature verification for simulation)
    const balanceCheck = await authService.checkZCORPBalance(userAddress);
    
    if (!balanceCheck.isQualified) {
      return res.status(401).json({
        error: 'Insufficient ZCORP balance for simulation',
        balance: balanceCheck,
      });
    }

    // Simulate deployment
    const simulation = await clankerService.simulateDeployment({
      ...tokenConfig,
      deployedBy: userAddress,
    });

    res.json(simulation);

  } catch (error) {
    console.error('❌ Simulation error:', error);
    res.status(500).json({
      error: 'Simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;