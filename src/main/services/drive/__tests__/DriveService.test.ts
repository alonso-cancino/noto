/**
 * Tests for DriveService
 */

import { DriveService } from '../DriveService';
import { DriveAuthService } from '../DriveAuthService';

jest.mock('googleapis');
jest.mock('../DriveAuthService');

describe('DriveService', () => {
  let authService: DriveAuthService;
  let driveService: DriveService;

  beforeEach(() => {
    authService = new DriveAuthService({
      clientId: 'test',
      clientSecret: 'test',
      redirectUri: 'test',
    });
    driveService = new DriveService(authService);
  });

  it('should initialize with auth service', () => {
    expect(driveService).toBeDefined();
  });

  it('should check authentication status', async () => {
    const isAuth = await driveService.isAuthenticated();
    expect(typeof isAuth).toBe('boolean');
  });

  // Note: Full API testing requires integration tests with Google Drive
  // These are unit tests for the service structure
});
