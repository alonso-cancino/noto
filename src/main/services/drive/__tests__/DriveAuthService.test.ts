/**
 * Tests for DriveAuthService
 */

import { DriveAuthService } from '../DriveAuthService';

// Mock Electron modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn(),
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: jest.fn(),
    decryptString: jest.fn(),
  },
}));

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }));
});

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn(() => 'https://accounts.google.com/o/oauth2/auth?...'),
        getToken: jest.fn(async () => ({
          tokens: {
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            expiry_date: Date.now() + 3600000,
            scope: 'https://www.googleapis.com/auth/drive.file',
            token_type: 'Bearer',
          },
        })),
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn(async () => ({
          credentials: {
            access_token: 'new_access_token',
            expiry_date: Date.now() + 3600000,
          },
        })),
        revokeToken: jest.fn(),
        credentials: {},
      })),
    },
  },
}));

describe('DriveAuthService', () => {
  const mockCredentials = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/oauth/callback',
  };

  let service: DriveAuthService;

  beforeEach(() => {
    service = new DriveAuthService(mockCredentials);
  });

  it('should initialize with credentials', () => {
    expect(service).toBeDefined();
  });

  it('should check authentication status', async () => {
    const isAuth = await service.isAuthenticated();
    expect(typeof isAuth).toBe('boolean');
  });

  it('should get OAuth2 client', () => {
    const client = service.getOAuth2Client();
    expect(client).toBeDefined();
  });

  // Note: Full OAuth flow testing requires integration tests
  // These are unit tests for the service structure
});
