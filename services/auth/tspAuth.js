const axios = require('axios');
const { TSPToken, Error } = require('../../models');

/**
 * TSP Authentication Service
 * Handles login, token refresh, and token management for Saafe TSP APIs
 */
class TSPAuthService {
  constructor() {
    this.baseURL = process.env.SAAFE_API_BASE_URL || 'https://uat.tsp.api.saafe.tech';
    this.loginEmail = process.env.SAAFE_LOGIN_EMAIL;
    this.loginPassword = process.env.SAAFE_LOGIN_PASSWORD;
  }

  /**
   * Login to Saafe TSP and get access token
   * POST /api/login
   */
  async login() {
    try {
      console.log('🔐 Attempting to login to Saafe TSP...');

      const response = await axios.post(
        `${this.baseURL}/api/login`,
        {
          email: this.loginEmail,
          password: this.loginPassword
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        const { access_token, refresh_token, token_type, fiu_id } = response.data.data;
        
        // Calculate expiration time (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Deactivate old tokens
        await TSPToken.updateMany(
          { is_active: true },
          { is_active: false }
        );

        // Store new token
        const token = await TSPToken.create({
          access_token,
          refresh_token,
          token_type: token_type || 'bearer',
          fiu_id: fiu_id || 'default',
          expires_at: expiresAt,
          is_active: true
        });

        console.log('✅ Login successful! Token stored in database.');
        console.log(`   Token expires at: ${expiresAt.toISOString()}`);

        return {
          success: true,
          token: access_token,
          expiresAt,
          tokenRecord: token
        };
      } else {
        throw new Error('Invalid response from login API');
      }
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      
      // Log error to database
      await Error.create({
        context: 'LOGIN',
        error_category: error.response?.status === 403 || error.response?.status === 401 
          ? 'AUTHENTICATION' 
          : 'INFRA_NETWORK',
        error_message: error.message,
        http_status_code: error.response?.status || null,
        raw_response: error.response?.data || null,
        is_retryable: !error.response || error.response?.status >= 500
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /api/refresh
   */
  async refreshToken() {
    try {
      console.log('🔄 Attempting to refresh token...');

      // Get current active token
      const currentToken = await TSPToken.getActiveToken();
      if (!currentToken || !currentToken.refresh_token) {
        throw new Error('No active token or refresh token found');
      }

      const response = await axios.post(
        `${this.baseURL}/api/refresh`,
        {
          refresh_token: currentToken.refresh_token
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        const { access_token, token_type } = response.data.data;
        
        // Calculate new expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Update token in database
        currentToken.access_token = access_token;
        currentToken.expires_at = expiresAt;
        currentToken.updatedAt = new Date();
        await currentToken.save();

        console.log('✅ Token refreshed successfully!');
        console.log(`   New token expires at: ${expiresAt.toISOString()}`);

        return {
          success: true,
          token: access_token,
          expiresAt
        };
      } else {
        throw new Error('Invalid response from refresh API');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);

      // Log error
      await Error.create({
        context: 'REFRESH_TOKEN',
        error_category: error.response?.status === 403 || error.response?.status === 401
          ? 'AUTHENTICATION'
          : 'INFRA_NETWORK',
        error_message: error.message,
        http_status_code: error.response?.status || null,
        raw_response: error.response?.data || null,
        is_retryable: !error.response || error.response?.status >= 500
      });

      // If refresh fails, we need to login again
      console.log('🔄 Refresh failed, attempting new login...');
      return await this.login();
    }
  }

  /**
   * Get valid access token (auto-refresh if needed)
   * Checks if token is valid and refreshes if expiring soon
   */
  async getValidToken() {
    try {
      // Get active token from database
      const token = await TSPToken.getActiveToken();

      // If no token exists, login
      if (!token) {
        console.log('📝 No token found, logging in...');
        const loginResult = await this.login();
        if (!loginResult.success) {
          throw new Error('Failed to login: ' + loginResult.error);
        }
        return loginResult.token;
      }

      // Check if token is expired
      if (token.isExpired()) {
        console.log('⏰ Token expired, refreshing...');
        const refreshResult = await this.refreshToken();
        if (!refreshResult.success) {
          throw new Error('Failed to refresh token');
        }
        return refreshResult.token;
      }

      // Check if token is expiring soon (within 5 minutes)
      if (token.isExpiringSoon(5)) {
        console.log('⏰ Token expiring soon, refreshing proactively...');
        const refreshResult = await this.refreshToken();
        if (!refreshResult.success) {
          // If refresh fails but token is still valid, use current token
          console.log('⚠️ Refresh failed, but using current token...');
          return token.access_token;
        }
        return refreshResult.token;
      }

      // Token is valid
      return token.access_token;
    } catch (error) {
      console.error('❌ Error getting valid token:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new TSPAuthService();

