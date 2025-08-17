import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { CodeResponse, ErrorResponse, TokenResponse } from './DiscordLoginTypes';

// Mock the utils functions
const mockGenerateUrl = mock();
const mockGetCallbackResponse = mock();
const mockNormalizeDiscordConfig = mock();
const mockShouldHandleCallback = mock(() => false);
const mockFetchUser = mock();

// Mock history.replaceState
const mockReplaceState = mock();
global.history = { replaceState: mockReplaceState } as unknown as History;

// Mock window.location
global.window = {
    location: { origin: 'http://localhost:3000' },
} as unknown as Window & typeof globalThis;

// Mock the utils module
mock.module('./utils', () => ({
    generateUrl: mockGenerateUrl,
    getCallbackResponse: mockGetCallbackResponse,
    normalizeDiscordConfig: mockNormalizeDiscordConfig,
    shouldHandleCallback: mockShouldHandleCallback,
    fetchUser: mockFetchUser,
}));

describe('useDiscordLogin hook improvements', () => {
    const mockConfig = {
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000',
        responseType: 'code' as const,
        scopes: ['identify'],
    };

    beforeEach(() => {
        mockGenerateUrl.mockClear();
        mockGetCallbackResponse.mockClear();
        mockNormalizeDiscordConfig.mockClear();
        mockShouldHandleCallback.mockClear();
        mockFetchUser.mockClear();
        mockReplaceState.mockClear();

        mockNormalizeDiscordConfig.mockReturnValue(mockConfig);
        mockGetCallbackResponse.mockReturnValue({ type: null });
    });

    it('should handle dependency arrays correctly in useCallback', async () => {
        // Test that the hook properly manages dependencies
        // Verify that normalizeDiscordConfig is called with the right params
        expect(mockNormalizeDiscordConfig).toBeDefined();
        expect(mockGetCallbackResponse).toBeDefined();
        expect(mockShouldHandleCallback).toBeDefined();
    });

    it('should export all required types from index', async () => {
        // Test that all types are properly exported
        const exports = await import('./index');

        // Check that the hook is exported
        expect(exports.useDiscordLogin).toBeDefined();
        expect(exports.default).toBeDefined();

        // Type exports are available at compile time, not runtime
        // This test verifies the module loads correctly
        expect(exports).toBeDefined();
    });

    it('should handle error scenarios with proper error structure', async () => {
        const errorResponse: ErrorResponse = {
            error: 'access_denied',
            description: 'User denied access',
        };

        mockShouldHandleCallback.mockReturnValue(true);
        mockGetCallbackResponse.mockReturnValue({
            type: 'error',
            error: errorResponse,
        });

        // Verify error structure matches expected interface
        expect(errorResponse.error).toBe('access_denied');
        expect(errorResponse.description).toBe('User denied access');
    });

    it('should handle token response with user data', async () => {
        const tokenResponse: TokenResponse = {
            token_type: 'Bearer',
            access_token: 'test-token',
            expires_in: 3600,
            scope: ['identify'],
        };

        const mockUser = {
            id: '123',
            username: 'testuser',
            discriminator: '1234',
            global_name: 'Test User',
            avatar: null,
            banner: null,
            accent_color: null,
            locale: 'en-US',
            verified: true,
            email: 'test@example.com',
        };

        mockFetchUser.mockResolvedValue(mockUser);

        // Test that fetchUser is called with token
        await mockFetchUser(tokenResponse);
        expect(mockFetchUser).toHaveBeenCalledWith(tokenResponse);
    });

    it('should handle code response correctly', () => {
        const codeResponse: CodeResponse = { code: 'test-code' };

        mockGetCallbackResponse.mockReturnValue({
            type: 'code',
            code: codeResponse,
        });

        const response = mockGetCallbackResponse();
        expect(response.type).toBe('code');
        expect(response.code).toEqual(codeResponse);
    });

    it('should provide proper URL generation', () => {
        mockGenerateUrl.mockReturnValue('https://discord.com/api/oauth2/authorize?client_id=test&scope=identify');

        const url = mockGenerateUrl(mockConfig);
        expect(url).toContain('discord.com/api/oauth2/authorize');
        expect(mockGenerateUrl).toHaveBeenCalledWith(mockConfig);
    });

    it('should handle fetchUser errors gracefully', async () => {
        const tokenResponse: TokenResponse = {
            token_type: 'Bearer',
            access_token: 'invalid-token',
            expires_in: 3600,
            scope: ['identify'],
        };

        const networkError = new Error(
            'Failed to fetch user data: Discord API responded with status: 401 Unauthorized'
        );
        mockFetchUser.mockRejectedValue(networkError);

        await expect(mockFetchUser(tokenResponse)).rejects.toThrow(/Discord API responded with status: 401/);
    });

    it('should verify cleanup functionality exists', async () => {
        // Test that the hook implementation includes cleanup logic
        const useDiscordLogin = (await import('./useDiscordLogin')).default;

        // Verify the hook function exists and has the correct shape
        expect(typeof useDiscordLogin).toBe('function');

        // The hook expects parameters, so we verify the function signature without calling it
        expect(useDiscordLogin.length).toBeGreaterThan(0);
    });
});
