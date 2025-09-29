/**
 * AWS Cognito Authentication Service
 * Handles OIDC authorization code flow with PKCE for secure authentication
 * Includes return URL state preservation for seamless user experience
 */

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
  domain: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

export interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface CognitoUser {
  sub: string;
  email: string;
  email_verified: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  preferred_username?: string;
  cognito_username?: string;
}

export interface PageState {
  url: string;
  pathname: string;
  search: string;
  hash: string;
  timestamp: number;
}

class CognitoAuthService {
  private config: CognitoConfig;
  private tokens: CognitoTokens | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      userPoolId: 'us-east-1_FJUcN8W07',
      clientId: '4lt0iqap612c9jug55f3a1s69k',
      region: 'us-east-1',
      domain: 'auth.dev.np-topvitaminsupply.com',
      redirectUri: 'https://dev.np-totalvitaminsupply.com/auth/cognito/callback',
      scope: 'email openid phone',
      responseType: 'code'
    };
  }

  /**
   * Capture current page state for return URL preservation
   */
  private capturePageState(): PageState {
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      timestamp: Date.now()
    };
  }

  /**
   * Validate return URL to prevent open redirects
   */
  private validateReturnUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const allowedOrigins = [
        'https://dev.np-totalvitaminsupply.com',
        'http://localhost:3000',
        'http://localhost:5173'
      ];
      
      // Check if the origin is allowed
      const isAllowedOrigin = allowedOrigins.some(origin => 
        urlObj.origin === origin || urlObj.origin.startsWith(origin)
      );
      
      if (!isAllowedOrigin) {
        console.warn('Return URL not in allowed origins:', urlObj.origin);
        return false;
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /file:/i
      ];
      
      const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
        pattern.test(url)
      );
      
      if (hasSuspiciousPattern) {
        console.warn('Return URL contains suspicious pattern:', url);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Invalid return URL:', url, error);
      return false;
    }
  }

  /**
   * Get default return URL if current page state is invalid
   */
  private getDefaultReturnUrl(): string {
    return 'https://dev.np-totalvitaminsupply.com/dashboard';
  }

  /**
   * Initiate Cognito authentication with full redirect to managed login page
   * Preserves current page state for return after authentication
   * @param returnUrl - Optional specific return URL (defaults to current page)
   */
  async login(returnUrl?: string): Promise<void> {
    try {
      // Determine return URL
      let finalReturnUrl: string;
      
      if (returnUrl) {
        // Use provided return URL if valid
        if (this.validateReturnUrl(returnUrl)) {
          finalReturnUrl = returnUrl;
        } else {
          console.warn('Provided return URL is invalid, using current page');
          finalReturnUrl = this.capturePageState().url;
        }
      } else {
        // Use current page state
        const pageState = this.capturePageState();
        if (this.validateReturnUrl(pageState.url)) {
          finalReturnUrl = pageState.url;
        } else {
          console.warn('Current page URL is invalid, using default');
          finalReturnUrl = this.getDefaultReturnUrl();
        }
      }

      // Store page state in sessionStorage for additional context
      const pageState = this.capturePageState();
      sessionStorage.setItem('cognito_page_state', JSON.stringify(pageState));
      
      // Build login URL with return URL
      const loginUrl = `/auth/cognito/login?return_url=${encodeURIComponent(finalReturnUrl)}`;
      
      console.log('Redirecting to Cognito login with return URL:', finalReturnUrl);
      console.log('Page state captured:', pageState);
      
      // Full redirect to managed login page
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Error initiating Cognito login:', error);
      throw new Error('Failed to initiate login');
    }
  }

  /**
   * Handle authentication callback from Cognito
   * This is called by the backend callback handler
   */
  async handleCallback(): Promise<boolean> {
    try {
      // The callback is handled by the backend
      // The backend will redirect back to the return URL with session established
      console.log('Cognito callback handled by backend');
      return true;
    } catch (error) {
      console.error('Error handling Cognito callback:', error);
      return false;
    }
  }

  /**
   * Restore page state after authentication
   * This can be called after successful authentication to restore user context
   */
  restorePageState(): PageState | null {
    try {
      const storedState = sessionStorage.getItem('cognito_page_state');
      if (storedState) {
        const pageState: PageState = JSON.parse(storedState);
        
        // Validate the stored state
        if (this.validateReturnUrl(pageState.url)) {
          console.log('Restoring page state:', pageState);
          return pageState;
        } else {
          console.warn('Stored page state URL is invalid');
        }
      }
    } catch (error) {
      console.error('Error restoring page state:', error);
    }
    
    // Clean up invalid state
    sessionStorage.removeItem('cognito_page_state');
    return null;
  }

  /**
   * Clear stored page state
   */
  clearPageState(): void {
    sessionStorage.removeItem('cognito_page_state');
    console.log('Page state cleared');
  }

  /**
   * Refresh tokens using backend integration
   * This makes a backend call to refresh tokens securely
   */
  async refreshTokens(): Promise<CognitoTokens | null> {
    try {
      const response = await fetch('/auth/cognito/refresh', {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.access_token) {
        this.tokens = {
          accessToken: data.access_token,
          idToken: data.id_token || '',
          refreshToken: data.refresh_token || '',
          expiresIn: data.expires_in || 3600,
          tokenType: data.token_type || 'Bearer'
        };

        console.log('Tokens refreshed successfully');
        return this.tokens;
      } else {
        throw new Error('Invalid token refresh response');
      }
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      this.tokens = null;
      return null;
    }
  }

  /**
   * Setup automatic token refresh
   * Refreshes tokens every 5 minutes to maintain session
   */
  setupTokenRefresh(): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Refresh tokens every 5 minutes (300,000 milliseconds)
    this.refreshTimer = setInterval(async () => {
      try {
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          console.warn('Token refresh failed, user may need to re-authenticate');
          // Optionally redirect to login
          // this.login();
        }
      } catch (error) {
        console.error('Error in automatic token refresh:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('Automatic token refresh setup complete');
  }

  /**
   * Stop automatic token refresh
   */
  stopTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('Automatic token refresh stopped');
    }
  }

  /**
   * Logout from Cognito
   */
  async logout(): Promise<void> {
    try {
      // Stop token refresh
      this.stopTokenRefresh();
      
      // Clear local tokens and page state
      this.tokens = null;
      this.clearPageState();
      
      // Redirect to backend logout endpoint
      window.location.href = '/auth/cognito/logout';
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect to logout even if there's an error
      window.location.href = '/auth/cognito/logout';
    }
  }

  /**
   * Get current tokens
   */
  getTokens(): CognitoTokens | null {
    return this.tokens;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.tokens !== null;
  }

  /**
   * Get user information from ID token
   */
  getUserInfo(): CognitoUser | null {
    if (!this.tokens?.idToken) {
      return null;
    }

    try {
      // Parse JWT payload (in production, validate the token properly)
      const payload = this.parseJWT(this.tokens.idToken);
      return payload as CognitoUser;
    } catch (error) {
      console.error('Error parsing user info from token:', error);
      return null;
    }
  }

  /**
   * Parse JWT token payload (basic implementation)
   * In production, use a proper JWT library with validation
   */
  private parseJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      throw error;
    }
  }

  /**
   * Get Cognito configuration
   */
  getConfig(): CognitoConfig {
    return { ...this.config };
  }

  /**
   * Initialize authentication service
   * Call this when the app starts
   */
  async initialize(): Promise<void> {
    try {
      // Check if we have a valid session by trying to refresh tokens
      const refreshed = await this.refreshTokens();
      
      if (refreshed) {
        console.log('User session restored');
        this.setupTokenRefresh();
      } else {
        console.log('No valid session found');
      }
    } catch (error) {
      console.error('Error initializing Cognito auth:', error);
    }
  }
}

// Export singleton instance
export const cognitoAuth = new CognitoAuthService();

// Export class for testing
export { CognitoAuthService };
