const axios = require('axios');
const tspAuth = require('./auth/tspAuth');

/**
 * HTTP Client with automatic token injection and retry logic
 * Automatically handles token refresh on 403 errors
 */
class SaafeHTTPClient {
  constructor() {
    this.baseURL = process.env.SAAFE_API_BASE_URL || 'https://uat.tsp.api.saafe.tech';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000, // 15 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Make HTTP request with automatic token injection and retry on 403
   */
  async request(config) {
    try {
      // Get valid token
      const token = await tspAuth.getValidToken();

      // Add Authorization header
      const requestConfig = {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        }
      };

      // Make the request
      const response = await this.client.request(requestConfig);
      return response;

    } catch (error) {
      // Handle 403 Forbidden (token expired)
      if (error.response?.status === 403) {
        console.log('🔄 Got 403 error, refreshing token and retrying...');
        
        // Try to refresh token
        const refreshResult = await tspAuth.refreshToken();
        
        if (refreshResult.success) {
          // Retry the original request once
          try {
            const retryConfig = {
              ...config,
              headers: {
                ...config.headers,
                'Authorization': `Bearer ${refreshResult.token}`
              }
            };
            return await this.client.request(retryConfig);
          } catch (retryError) {
            console.error('❌ Retry after refresh also failed:', retryError.message);
            throw retryError;
          }
        } else {
          // Refresh failed, try full login
          console.log('🔄 Refresh failed, attempting full login...');
          const loginResult = await tspAuth.login();
          
          if (loginResult.success) {
            // Retry with new token
            try {
              const retryConfig = {
                ...config,
                headers: {
                  ...config.headers,
                  'Authorization': `Bearer ${loginResult.token}`
                }
              };
              return await this.client.request(retryConfig);
            } catch (retryError) {
              console.error('❌ Retry after login also failed:', retryError.message);
              throw retryError;
            }
          } else {
            throw new Error('Failed to authenticate after 403 error');
          }
        }
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  /**
   * DELETE request
   */
  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }
}

// Export singleton instance
module.exports = new SaafeHTTPClient();

