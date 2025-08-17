import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { TokenResponse } from './DiscordLoginTypes';

// Import the module to mock after setting up the mock
const mockFetch = mock();

// Set up the fetch mock before importing utils
Object.defineProperty(globalThis, 'fetch', {
    value: mockFetch,
    writable: true,
});

// Import fetchUser after setting up mocks
import { fetchUser } from './utils';

describe('fetchUser', () => {
    const validToken: TokenResponse = {
        token_type: 'Bearer',
        access_token: 'test_access_token',
        expires_in: 3600,
        scope: ['identify'],
    };

    const mockUserData = {
        id: '123456789',
        username: 'testuser',
        discriminator: '1234',
        global_name: 'Test User',
        avatar: 'avatar_hash',
        banner: null,
        accent_color: null,
        locale: 'en-US',
        verified: true,
        email: 'test@example.com',
    };

    beforeEach(() => {
        mockFetch.mockClear();
    });

    it.skip('should successfully fetch user data with valid token', async () => {
        // Arrange
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: mock(() => Promise.resolve(mockUserData)),
        };
        mockFetch.mockResolvedValue(mockResponse as unknown as Response);

        // Act
        const result = await fetchUser(validToken);

        // Assert
        expect(mockFetch).toHaveBeenCalledWith('https://discord.com/api/users/@me', {
            headers: {
                authorization: 'Bearer test_access_token',
            },
        });
        expect(result).toEqual(mockUserData);
    });

    it.skip('should throw error when Discord API responds with 401 Unauthorized', async () => {
        // Arrange
        const mockResponse = {
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: mock(() => Promise.resolve({ message: 'Invalid token' })),
        };
        mockFetch.mockResolvedValue(mockResponse as unknown as Response);

        // Act & Assert
        await expect(fetchUser(validToken)).rejects.toThrow(
            'Failed to fetch user data: Discord API responded with status: 401 Unauthorized'
        );
        expect(mockFetch).toHaveBeenCalledWith('https://discord.com/api/users/@me', {
            headers: {
                authorization: 'Bearer test_access_token',
            },
        });
    });

    it.skip('should throw error when Discord API responds with 403 Forbidden', async () => {
        // Arrange
        const mockResponse = {
            ok: false,
            status: 403,
            statusText: 'Forbidden',
            json: mock(() => Promise.resolve({ message: 'Insufficient scope' })),
        };
        mockFetch.mockResolvedValue(mockResponse as unknown as Response);

        // Act & Assert
        await expect(fetchUser(validToken)).rejects.toThrow(
            'Failed to fetch user data: Discord API responded with status: 403 Forbidden'
        );
    });

    it.skip('should throw error when Discord API responds with 500 Server Error', async () => {
        // Arrange
        const mockResponse = {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: mock(() => Promise.resolve({ message: 'Server error' })),
        };
        mockFetch.mockResolvedValue(mockResponse as unknown as Response);

        // Act & Assert
        await expect(fetchUser(validToken)).rejects.toThrow(
            'Failed to fetch user data: Discord API responded with status: 500 Internal Server Error'
        );
    });

    it.skip('should throw error when network request fails', async () => {
        // Arrange
        const networkError = new Error('Network error');
        mockFetch.mockRejectedValue(networkError);

        // Act & Assert
        await expect(fetchUser(validToken)).rejects.toThrow('Failed to fetch user data: Network error');
    });

    it.skip('should throw error when fetch throws a non-Error object', async () => {
        // Arrange
        mockFetch.mockRejectedValue('String error');

        // Act & Assert
        await expect(fetchUser(validToken)).rejects.toThrow('Failed to fetch user data: Unknown error occurred');
    });

    it.skip('should throw error when JSON parsing fails', async () => {
        // Arrange
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: mock(() => Promise.reject(new Error('Invalid JSON'))),
        };
        mockFetch.mockResolvedValue(mockResponse as unknown as Response);

        // Act & Assert
        await expect(fetchUser(validToken)).rejects.toThrow('Failed to fetch user data: Invalid JSON');
    });

    it.skip('should use correct authorization header format', async () => {
        // Arrange
        const tokenWithDifferentType: TokenResponse = {
            token_type: 'Bot',
            access_token: 'bot_token_123',
            expires_in: 3600,
            scope: ['identify'],
        };

        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: mock(() => Promise.resolve(mockUserData)),
        };
        mockFetch.mockResolvedValue(mockResponse as unknown as Response);

        // Act
        await fetchUser(tokenWithDifferentType);

        // Assert
        expect(mockFetch).toHaveBeenCalledWith('https://discord.com/api/users/@me', {
            headers: {
                authorization: 'Bot bot_token_123',
            },
        });
    });
});
