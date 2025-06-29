import express from 'express';
import { z } from 'zod';
import { dbService } from '../database/connection';

const router = express.Router();

// Validation schemas
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');
const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Get deployment history for a user
router.get('/deployments/:userAddress', async (req, res) => {
  try {
    // Validate input
    const userAddressResult = addressSchema.safeParse(req.params.userAddress);
    if (!userAddressResult.success) {
      return res.status(400).json({
        error: 'Invalid user address format',
        details: userAddressResult.error.errors,
      });
    }

    const paginationResult = paginationSchema.safeParse({
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
    });

    const { page, limit } = paginationResult.data;
    const offset = (page - 1) * limit;
    const userAddress = userAddressResult.data;

    // Get deployments with pagination
    const deployments = await dbService.query(
      `SELECT 
        id,
        token_address,
        tx_hash,
        JSON_EXTRACT(token_config, '$.name') as token_name,
        JSON_EXTRACT(token_config, '$.symbol') as token_symbol,
        created_at,
        status
       FROM deployments 
       WHERE deployed_by = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userAddress, limit, offset]
    );

    // Get total count
    const countResult = await dbService.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM deployments WHERE deployed_by = ?',
      [userAddress]
    );
    const totalCount = countResult?.count || 0;

    res.json({
      deployments: deployments.map((d: any) => ({
        id: d.id,
        tokenAddress: d.token_address,
        txHash: d.tx_hash,
        tokenName: d.token_name,
        tokenSymbol: d.token_symbol,
        createdAt: d.created_at,
        status: d.status,
        explorerUrl: `https://basescan.org/token/${d.token_address}`,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching deployments:', error);
    res.status(500).json({
      error: 'Failed to fetch deployment history',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get deployment details by ID
router.get('/deployment/:deploymentId', async (req, res) => {
  try {
    const deploymentId = req.params.deploymentId;

    // Validate deployment ID format (UUID)
    if (!deploymentId || typeof deploymentId !== 'string' || deploymentId.length < 10) {
      return res.status(400).json({
        error: 'Invalid deployment ID format',
      });
    }

    const deployment = await dbService.get(
      `SELECT 
        id,
        token_address,
        deployed_by,
        tx_hash,
        token_config,
        created_at,
        status
       FROM deployments 
       WHERE id = ?`,
      [deploymentId]
    );

    if (!deployment) {
      return res.status(404).json({
        error: 'Deployment not found',
      });
    }

    res.json({
      id: deployment.id,
      tokenAddress: deployment.token_address,
      deployedBy: deployment.deployed_by,
      txHash: deployment.tx_hash,
      tokenConfig: JSON.parse(deployment.token_config),
      createdAt: deployment.created_at,
      status: deployment.status,
      explorerUrl: `https://basescan.org/token/${deployment.token_address}`,
    });

  } catch (error) {
    console.error('❌ Error fetching deployment:', error);
    res.status(500).json({
      error: 'Failed to fetch deployment details',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get user statistics
router.get('/stats/:userAddress', async (req, res) => {
  try {
    // Validate user address
    const userAddressResult = addressSchema.safeParse(req.params.userAddress);
    if (!userAddressResult.success) {
      return res.status(400).json({
        error: 'Invalid user address format',
        details: userAddressResult.error.errors,
      });
    }

    const userAddress = userAddressResult.data;

    // Get deployment statistics
    const stats = await dbService.get(
      `SELECT 
        COUNT(*) as total_deployments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_deployments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_deployments,
        MIN(created_at) as first_deployment,
        MAX(created_at) as latest_deployment
       FROM deployments 
       WHERE deployed_by = ?`,
      [userAddress]
    );

    // Get user session info
    const session = await dbService.get(
      'SELECT zcorp_balance, last_verified, deployment_count FROM user_sessions WHERE user_address = ?',
      [userAddress]
    );

    const totalDeployments = stats?.total_deployments || 0;
    const successfulDeployments = stats?.successful_deployments || 0;

    res.json({
      totalDeployments,
      successfulDeployments,
      failedDeployments: stats?.failed_deployments || 0,
      firstDeployment: stats?.first_deployment,
      latestDeployment: stats?.latest_deployment,
      zcorpBalance: session?.zcorp_balance || '0',
      lastVerified: session?.last_verified,
      successRate: totalDeployments > 0 ? 
        (successfulDeployments / totalDeployments * 100).toFixed(1) + '%' : 
        'N/A',
    });

  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({
      error: 'Failed to fetch user statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;