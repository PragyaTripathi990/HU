const express = require('express');
const router = express.Router();
const tspAuth = require('../services/auth/tspAuth');
const { TSPToken } = require('../models');

/**
 * GET /api/auth/status
 * Check current authentication status
 */
router.get('/status', async (req, res) => {
  try {
    const token = await TSPToken.getActiveToken();
    
    if (!token) {
      return res.json({
        success: false,
        authenticated: false,
        message: 'No active token found'
      });
    }

    const isExpired = token.isExpired();
    const isExpiringSoon = token.isExpiringSoon(5);

    res.json({
      success: true,
      authenticated: !isExpired,
      token: {
        fiu_id: token.fiu_id,
        expires_at: token.expires_at,
        is_expired: isExpired,
        is_expiring_soon: isExpiringSoon,
        minutes_until_expiry: isExpired ? 0 : Math.floor((token.expires_at - new Date()) / 60000)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Manually trigger login
 */
router.post('/login', async (req, res) => {
  try {
    const result = await tspAuth.login();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Login successful',
        expires_at: result.expiresAt
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/refresh
 * Manually trigger token refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const result = await tspAuth.refreshToken();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        expires_at: result.expiresAt
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auth/test-token
 * Test getting a valid token (used for testing)
 */
router.get('/test-token', async (req, res) => {
  try {
    const token = await tspAuth.getValidToken();
    res.json({
      success: true,
      message: 'Token retrieved successfully',
      token_length: token.length,
      token_preview: token.substring(0, 20) + '...'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

