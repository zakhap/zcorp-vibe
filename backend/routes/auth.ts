import express from 'express';
import { authService } from '../services/authService';

const router = express.Router();

// Check ZCORP token balance for a given address
router.get('/verify-balance/:address', async (req, res) => {
  try {
    const userAddress = req.params.address as `0x${string}`;
    
    if (!userAddress || !userAddress.startsWith('0x') || userAddress.length !== 42) {
      return res.status(400).json({
        error: 'Invalid Ethereum address format',
      });
    }

    const result = await authService.checkZCORPBalance(userAddress);
    
    res.json(result);
  } catch (error) {
    console.error('Balance verification error:', error);
    res.status(500).json({
      error: 'Failed to verify ZCORP balance',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Verify user signature and ZCORP token ownership
router.post('/verify-signature', async (req, res) => {
  try {
    const { userAddress, signature, message, timestamp } = req.body;

    if (!userAddress || !signature || !message || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields: userAddress, signature, message, timestamp',
      });
    }

    const result = await authService.verifyZCORPHolder({
      userAddress: userAddress as `0x${string}`,
      signature: signature as `0x${string}`,
      message,
      timestamp,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({
      error: 'Failed to verify signature',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;