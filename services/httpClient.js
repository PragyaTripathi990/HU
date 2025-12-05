const axios = require('axios');
const tokenService = require('./auth/tokenService');

/**
 * HTTP Client with Automatic Token Management
 * Uses axios interceptors to automatically attach Bearer tokens
 * Handles 401 Unauthorized by auto-refreshing tokens
 */
class SaafeHTTPClient {
  constructor() {
    this.baseURL = process.env.SAAFE_API_BASE_URL || 'https://uat.tsp.api.saafe.tech';
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor: Add Bearer token to every request
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Get valid token (auto-login if needed)
          const token = await tokenService.getToken();
          
          // Add Authorization header
          config.headers.Authorization = `Bearer ${token}`;
          
          return config;
        } catch (error) {
          console.error('❌ Error getting token for request:', error.message);
          return Promise.reject(error);
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle 401 Unauthorized
    this.client.interceptors.response.use(
      (response) => {
        // Success response, return as-is
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log('🔄 Got 401 Unauthorized, refreshing token and retrying...');
          
          try {
            // Clear token cache and get new token
            tokenService.clearCache();
            const newToken = await tokenService.getToken();
            
            // Update Authorization header
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Retry the original request
            return this.client.request(originalRequest);
          } catch (refreshError) {
            console.error('❌ Failed to refresh token after 401:', refreshError.message);
            return Promise.reject(refreshError);
          }
        }

        // Handle 403 Forbidden (also try refresh)
        if (error.response?.status === 403 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log('🔄 Got 403 Forbidden, refreshing token and retrying...');
          
          try {
            tokenService.clearCache();
            const newToken = await tokenService.getToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client.request(originalRequest);
          } catch (refreshError) {
            console.error('❌ Failed to refresh token after 403:', refreshError.message);
            return Promise.reject(refreshError);
          }
        }

        // For other errors, reject as-is
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * POST request
   */
  async post(url, data, config = {}) {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   */
  async put(url, data, config = {}) {
    return this.client.put(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

// Export singleton instance
module.exports = new SaafeHTTPClient();
