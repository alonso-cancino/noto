/**
 * DriveAuthService - Handles Google OAuth 2.0 authentication flow
 *
 * Manages:
 * - OAuth flow with Google
 * - Token storage (access + refresh tokens)
 * - Token refresh when expired
 * - Secure token encryption using Electron safeStorage
 */

import { BrowserWindow, safeStorage } from 'electron';
import { google } from 'googleapis';
import Store from 'electron-store';

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class DriveAuthService {
  private oauth2Client: any;
  private store: Store;
  private credentials: GoogleCredentials;

  constructor(credentials: GoogleCredentials) {
    this.credentials = credentials;
    this.store = new Store();

    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    // Load existing tokens if available
    this.loadTokens().then(tokens => {
      if (tokens) {
        this.oauth2Client.setCredentials(tokens);
      }
    });
  }

  /**
   * Start OAuth flow - opens browser window for user consent
   */
  async authenticate(): Promise<OAuthTokens> {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });

    // Open auth window and wait for callback
    const authCode = await this.openAuthWindow(authUrl);

    // Exchange code for tokens
    const { tokens } = await this.oauth2Client.getToken(authCode);
    this.oauth2Client.setCredentials(tokens);

    // Save tokens securely
    await this.saveTokens(tokens as OAuthTokens);

    return tokens as OAuthTokens;
  }

  /**
   * Open browser window for OAuth consent
   */
  private async openAuthWindow(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const authWindow = new BrowserWindow({
        width: 500,
        height: 600,
        show: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      authWindow.loadURL(authUrl);

      // Listen for redirect to callback URL
      authWindow.webContents.on('will-redirect', (event, url) => {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');

        if (code) {
          authWindow.close();
          resolve(code);
        }
      });

      authWindow.on('closed', () => {
        reject(new Error('Authentication window closed by user'));
      });
    });
  }

  /**
   * Get valid access token (refreshes if expired)
   */
  async getAccessToken(): Promise<string> {
    const tokens = await this.loadTokens();

    if (!tokens) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    // Check if token is expired
    const now = Date.now();
    if (tokens.expiry_date && now >= tokens.expiry_date) {
      // Token expired, refresh it
      const newTokens = await this.refreshAccessToken();
      return newTokens.access_token;
    }

    return tokens.access_token;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<OAuthTokens> {
    const tokens = await this.loadTokens();

    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available. Please re-authenticate.');
    }

    this.oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    const newTokens = {
      ...tokens,
      ...credentials,
    } as OAuthTokens;

    await this.saveTokens(newTokens);
    return newTokens;
  }

  /**
   * Get OAuth client for googleapis
   */
  getOAuth2Client() {
    return this.oauth2Client;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.loadTokens();
    return tokens !== null && tokens.access_token !== undefined;
  }

  /**
   * Sign out - clear stored tokens
   */
  async signOut(): Promise<void> {
    await this.oauth2Client.revokeToken(this.oauth2Client.credentials.access_token);
    this.store.delete('oauth_tokens_encrypted');
    this.oauth2Client.setCredentials({});
  }

  /**
   * Save tokens securely using Electron safeStorage
   */
  private async saveTokens(tokens: OAuthTokens): Promise<void> {
    const tokensJson = JSON.stringify(tokens);

    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(tokensJson);
      this.store.set('oauth_tokens_encrypted', encrypted.toString('base64'));
    } else {
      // Fallback if encryption not available (development mode)
      console.warn('safeStorage encryption not available, storing tokens unencrypted');
      this.store.set('oauth_tokens', tokens);
    }
  }

  /**
   * Load tokens from secure storage
   */
  private async loadTokens(): Promise<OAuthTokens | null> {
    try {
      const encryptedBase64 = this.store.get('oauth_tokens_encrypted') as string;

      if (encryptedBase64 && safeStorage.isEncryptionAvailable()) {
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decrypted = safeStorage.decryptString(encrypted);
        return JSON.parse(decrypted);
      }

      // Fallback for development
      const tokens = this.store.get('oauth_tokens') as OAuthTokens;
      return tokens || null;
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return null;
    }
  }

  /**
   * Get current credentials (for debugging)
   */
  async getCredentials(): Promise<OAuthTokens | null> {
    return this.loadTokens();
  }
}
