const axios = require('axios');
const { TSPToken } = require('../../models');

/**
 * Token Service with In-Memory Caching
 * Automatically manages authentication tokens for Saafe API
 * Caches tokens in memory for faster access
 */
class TokenService {
  constructor() {
    this.baseURL = process.env.SAAFE_API_BASE_URL || 'https://uat.tsp.api.saafe.tech';
    this.loginEmail = process.env.SAAFE_LOGIN_EMAIL || 'vikas.bansal@handauncle.com';
    this.loginPassword = process.env.SAAFE_LOGIN_PASSWORD || 'YRo9fG3%1^ki';
    
    // In-memory token cache
    this.tokenCache = {
      access_token: null,
      expires_at: null,
      refresh_token: null
    };
  }

  /**
   * Get valid access token
   * - Returns cached token if valid
   * - Auto-login if no token exists
   * - Auto-refresh if token expired
   */
  async getToken() {
    try {
      // Check in-memory cache first
      if (this.tokenCache.access_token && this.tokenCache.expires_at) {
        const now = new Date();
        const expiresAt = new Date(this.tokenCache.expires_at);
        
        // If token expires in more than 5 minutes, return cached token
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        if (timeUntilExpiry > 5 * 60 * 1000) {
          console.log('✅ Using cached token');
          return this.tokenCache.access_token;
        }
        
        // Token expiring soon, try to refresh
        if (timeUntilExpiry > 0) {
          console.log('⏰ Token expiring soon, attempting refresh...');
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.tokenCache.access_token;
          }
        }
      }

      // Check database for token
      const dbToken = await TSPToken.getActiveToken();
      if (dbToken && !dbToken.isExpired()) {
        // Update cache from database
        this.tokenCache = {
          access_token: dbToken.access_token,
          expires_at: dbToken.expires_at,
          refresh_token: dbToken.refresh_token
        };
        
        // Check if expiring soon
        if (dbToken.isExpiringSoon(5)) {
          console.log('⏰ Token expiring soon, refreshing...');
          await this.refreshToken();
        }
        
        return this.tokenCache.access_token;
      }

      // No valid token found, login
      console.log('🔐 No valid token found, logging in...');
      await this.login();
      return this.tokenCache.access_token;

    } catch (error) {
      console.error('❌ Error getting token:', error.message);
      throw error;
    }
  }

  /**
   * Login to Saafe API
   * POST /api/login
   */
  async login() {
    try {
      console.log('🔐 Logging in to Saafe API...');

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
          timeout: 10000
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        const { access_token, refresh_token, token_type, fiu_id } = response.data.data;
        
        // Calculate expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Update in-memory cache
        this.tokenCache = {
          access_token,
          expires_at: expiresAt,
          refresh_token: refresh_token || this.tokenCache.refresh_token
        };

        // Deactivate old tokens in database
        await TSPToken.updateMany(
          { is_active: true },
          { is_active: false }
        );

        // Store in database
        await TSPToken.create({
          access_token,
          refresh_token: refresh_token || this.tokenCache.refresh_token,
          token_type: token_type || 'bearer',
          fiu_id: fiu_id || 'default',
          expires_at: expiresAt,
          is_active: true
        });

        console.log('✅ Login successful! Token cached.');
        console.log(`   Token expires at: ${expiresAt.toISOString()}`);

        return {
          success: true,
          token: access_token,
          expiresAt
        };
      } else {
        throw new Error('Invalid response from login API');
      }
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      
      // Clear cache on login failure
      this.tokenCache = {
        access_token: null,
        expires_at: null,
        refresh_token: null
      };

      return {
        success: false,
        error: error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Refresh access token
   * POST /api/refresh
   */
  async refreshToken() {
    try {
      console.log('🔄 Refreshing token...');

      // Get refresh token from cache or database
      let refreshToken = this.tokenCache.refresh_token;
      if (!refreshToken) {
        const dbToken = await TSPToken.getActiveToken();
        if (dbToken && dbToken.refresh_token) {
          refreshToken = dbToken.refresh_token;
        } else {
          throw new Error('No refresh token available');
        }
      }

      const response = await axios.post(
        `${this.baseURL}/api/refresh`,
        {
          refresh_token: refreshToken
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

        // Update in-memory cache
        this.tokenCache.access_token = access_token;
        this.tokenCache.expires_at = expiresAt;

        // Update database
        const dbToken = await TSPToken.getActiveToken();
        if (dbToken) {
          dbToken.access_token = access_token;
          dbToken.expires_at = expiresAt;
          await dbToken.save();
        }

        console.log('✅ Token refreshed successfully!');
        return true;
      } else {
        throw new Error('Invalid response from refresh API');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
      
      // If refresh fails, try login
      console.log('🔄 Refresh failed, attempting new login...');
      const loginResult = await this.login();
      return loginResult.success;
    }
  }

  /**
   * Clear token cache (useful for testing)
   */
  clearCache() {
    this.tokenCache = {
      access_token: null,
      expires_at: null,
      refresh_token: null
    };
  }
}

// Export singleton instance
module.exports = new TokenService();

