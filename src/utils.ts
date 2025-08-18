import type {
    DiscordLoginConfig,
    DiscordLoginParams,
    GetCallbackResponseFunc,
    TokenResponse,
    User,
} from './DiscordLoginTypes';

/**
 * Normalizes Discord OAuth2 configuration parameters with sensible defaults.
 *
 * @param params - Raw Discord login parameters
 * @param params.clientId - Discord application client ID
 * @param params.redirectUri - OAuth2 redirect URI (optional)
 * @param params.responseType - OAuth2 response type (optional)
 * @param params.scopes - Discord OAuth2 scopes array (optional)
 *
 * @returns Normalized configuration object
 *
 * @example
 * ```ts
 * const config = normalizeDiscordConfig({
 *   clientId: '123456789012345678',
 *   // Other params optional with defaults
 * });
 * // Returns: { clientId, redirectUri: window.location.origin, responseType: 'code', scopes: ['identify'] }
 * ```
 */
export const normalizeDiscordConfig = ({
    clientId,
    redirectUri: uri,
    responseType: type,
    scopes: scopesArray,
}: DiscordLoginParams): DiscordLoginConfig => {
    const redirectUri = uri || window.location.origin;
    const responseType = type || 'code';
    const scopes = scopesArray || ['identify'];

    return {
        clientId,
        redirectUri,
        responseType,
        scopes,
    };
};

/**
 * Generates Discord OAuth2 authorization URL.
 *
 * @param config - Normalized Discord OAuth2 configuration
 * @param config.clientId - Discord application client ID
 * @param config.redirectUri - OAuth2 redirect URI
 * @param config.responseType - OAuth2 response type ('code' or 'token')
 * @param config.scopes - Discord OAuth2 scopes array
 *
 * @returns Complete Discord authorization URL
 *
 * @example
 * ```ts
 * const url = generateUrl({
 *   clientId: '123456789012345678',
 *   redirectUri: 'https://myapp.com/callback',
 *   responseType: 'code',
 *   scopes: ['identify', 'email']
 * });
 * // Returns: 'https://discord.com/api/oauth2/authorize?client_id=123...&scope=identify%20email'
 * ```
 */
export const generateUrl = ({ clientId, redirectUri, responseType, scopes }: DiscordLoginConfig) => {
    const searchParams = new URLSearchParams();
    searchParams.append('client_id', clientId);
    searchParams.append('response_type', responseType);
    searchParams.append('redirect_uri', redirectUri);
    searchParams.append('scope', scopes.join(' '));

    return `https://discord.com/api/oauth2/authorize?${searchParams.toString()}`;
};

/**
 * Extracts and combines URL parameters from both query string and hash fragment.
 *
 * Discord OAuth2 can return parameters in either location depending on the response type:
 * - 'code' flow: parameters in query string (?code=...)
 * - 'token' flow: parameters in hash fragment (#access_token=...)
 *
 * @returns URLSearchParams containing combined parameters from both sources
 *
 * @internal This function is not exported and used internally by getCallbackResponse
 */
const getQueryAndHash = (): URLSearchParams => {
    const params = new URLSearchParams();

    const query = new URLSearchParams(window.location.search);
    query.forEach((value, key) => {
        params.set(key, value);
    });

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    fragment.forEach((value, key) => {
        params.set(key, value);
    });
    return params;
};
/**
 * Parses Discord OAuth2 callback response from current URL.
 *
 * Analyzes the current page URL (both query parameters and hash fragments) to detect
 * and parse Discord OAuth2 callback responses. Handles all three possible response types:
 * error, code, and token.
 *
 * @returns Parsed callback response object with discriminated union type
 *
 * @example
 * ```ts
 * // URL: https://app.com/callback?error=access_denied&error_description=User%20denied
 * const response = getCallbackResponse();
 * if (response.type === 'error') {
 *   console.error(response.error); // { error: 'access_denied', description: 'User denied' }
 * }
 *
 * // URL: https://app.com/callback?code=NhhvTDYsFcdgNLvQ
 * const response = getCallbackResponse();
 * if (response.type === 'code') {
 *   console.log(response.code); // { code: 'NhhvTDYsFcdgNLvQ' }
 * }
 *
 * // URL: https://app.com/callback#access_token=abc123&token_type=Bearer
 * const response = getCallbackResponse();
 * if (response.type === 'token') {
 *   console.log(response.token); // { access_token: 'abc123', token_type: 'Bearer', ... }
 * }
 * ```
 *
 * @remarks
 * - Returns `{ type: null }` if no OAuth2 callback parameters are detected
 * - Supports both query string (?code=...) and hash fragment (#access_token=...) parsing
 * - Automatically handles parameter type conversion (strings to numbers for expires_in)
 * - Splits space-separated scope strings into arrays
 */
export const getCallbackResponse: GetCallbackResponseFunc = () => {
    const params = getQueryAndHash();
    const error = params.get('error');
    const error_description = params.get('error_description');
    const token_type = params.get('token_type');
    const code = params.get('code');

    if (error || error_description) {
        return {
            type: 'error',
            error: {
                error: String(error),
                description: String(error_description),
            },
        };
    }

    if (token_type) {
        return {
            type: 'token',
            token: {
                token_type: String(token_type),
                access_token: String(params.get('access_token')),
                expires_in: Number(params.get('expires_in')),
                scope: String(params.get('scope')).split(' '),
            },
        };
    }

    if (code) {
        return {
            type: 'code',
            code: {
                code: String(code),
            },
        };
    }

    return {
        type: null,
    };
};

/**
 * Fetches Discord user data using an OAuth2 access token.
 *
 * Makes an authenticated request to Discord's `/users/@me` endpoint to retrieve
 * the current user's profile information. This function is automatically called
 * by the useDiscordLogin hook when using the 'token' response type.
 *
 * @param token - OAuth2 token response containing access token and metadata
 * @param token.access_token - The Discord access token
 * @param token.token_type - Token type (typically 'Bearer')
 *
 * @returns Promise resolving to Discord user object
 *
 * @throws {Error} When Discord API request fails
 * @throws {Error} When network request fails
 * @throws {Error} When response parsing fails
 *
 * @example
 * ```ts
 * const tokenResponse = {
 *   access_token: 'abc123...',
 *   token_type: 'Bearer',
 *   expires_in: 3600,
 *   scope: ['identify']
 * };
 *
 * try {
 *   const user = await fetchUser(tokenResponse);
 *   console.log(user.username); // Discord username
 *   console.log(user.id); // Discord user ID
 * } catch (error) {
 *   console.error('Failed to fetch user:', error.message);
 * }
 * ```
 *
 * @remarks
 * All errors are wrapped with descriptive messages:
 * - HTTP errors: "Failed to fetch user data: Discord API responded with status: 401 Unauthorized"
 * - Network errors: "Failed to fetch user data: Network connection failed"
 * - Unknown errors: "Failed to fetch user data: Unknown error occurred"
 */
export const fetchUser = async (token: TokenResponse): Promise<User> => {
    try {
        const result = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${token.token_type} ${token.access_token}`,
            },
        });

        if (!result.ok) {
            throw new Error(`Discord API responded with status: ${result.status} ${result.statusText}`);
        }

        const userData = await result.json();
        return userData as User;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch user data: ${error.message}`);
        }
        throw new Error('Failed to fetch user data: Unknown error occurred');
    }
};

/**
 * Determines if the current URL contains Discord OAuth2 callback parameters.
 *
 * Checks both query parameters and hash fragments for the presence of Discord OAuth2
 * callback indicators: 'code', 'error', or 'token_type'. Used by the useDiscordLogin
 * hook to decide whether to process the current URL as an OAuth2 callback.
 *
 * @returns True if OAuth2 callback parameters are detected, false otherwise
 *
 * @example
 * ```ts
 * // URL: https://app.com/callback?code=NhhvTDYsFcdgNLvQ
 * shouldHandleCallback(); // returns true
 *
 * // URL: https://app.com/callback#access_token=abc123&token_type=Bearer
 * shouldHandleCallback(); // returns true
 *
 * // URL: https://app.com/callback?error=access_denied
 * shouldHandleCallback(); // returns true
 *
 * // URL: https://app.com/normal-page
 * shouldHandleCallback(); // returns false
 * ```
 *
 * @remarks
 * This function enables the hook to automatically detect and process OAuth2 callbacks
 * without requiring explicit callback registration or route matching.
 */
export const shouldHandleCallback = (): boolean => {
    const params = getQueryAndHash();
    const keys = Array.from(params.keys());
    const targets = ['code', 'error', 'token_type'];
    return targets.some((target) => keys.includes(target));
};
