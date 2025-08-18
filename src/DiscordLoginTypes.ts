/**
 * Configuration parameters for Discord OAuth2 authentication.
 *
 * @public
 */
export interface DiscordLoginParams {
    /** Discord application client ID (18-19 digit snowflake) */
    clientId: string;
    /** OAuth2 redirect URI. Defaults to current origin if not provided */
    redirectUri?: string;
    /** OAuth2 response type. 'code' for server-side flow, 'token' for client-side flow. Defaults to 'code' */
    responseType?: 'token' | 'code';
    /** Array of Discord OAuth2 scopes. Defaults to ['identify'] */
    scopes?: string[];
}

/**
 * Normalized Discord OAuth2 configuration with all required properties.
 *
 * This is the internal configuration type used after applying defaults
 * to the user-provided DiscordLoginParams.
 *
 * @public
 */
export interface DiscordLoginConfig extends DiscordLoginParams {
    /** OAuth2 redirect URI (no longer optional) */
    redirectUri: string;
    /** OAuth2 response type (no longer optional) */
    responseType: 'token' | 'code';
    /** Array of Discord OAuth2 scopes (no longer optional) */
    scopes: string[];
}

/**
 * Discord user profile data returned by the Discord API.
 *
 * Contains user information fetched from Discord's `/users/@me` endpoint
 * when using the 'token' response type flow.
 *
 * @public
 */
export interface User {
    /** Discord user ID (snowflake) */
    id: string;
    /** Discord username (not including discriminator) */
    username: string;
    /** 4-digit discriminator (legacy, mostly '0' for new usernames) */
    discriminator: string;
    /** User's display name (newer system replacing username#discriminator) */
    global_name: string | null;
    /** Avatar hash for constructing avatar URLs */
    avatar: string | null;
    /** Banner hash for user profile banners */
    banner: string | null;
    /** User's accent color as hex string */
    accent_color: string | null;
    /** User's locale/language preference */
    locale: string | null;
    /** Whether the user's email is verified */
    verified: boolean;
    /** User's email address (requires 'email' scope) */
    email: string | null;
}

/**
 * OAuth2 error response from Discord.
 *
 * Returned when the OAuth2 flow fails (user denies access, invalid client, etc.)
 *
 * @public
 */
export interface ErrorResponse {
    /** OAuth2 error code (e.g., 'access_denied', 'invalid_request') */
    error: string;
    /** Human-readable error description */
    description: string;
}

/**
 * OAuth2 authorization code response from Discord.
 *
 * Returned when using 'code' response type. The code should be exchanged
 * for an access token on your backend server.
 *
 * @public
 */
export interface CodeResponse {
    /** Authorization code to exchange for access token */
    code: string;
}

/**
 * OAuth2 token response from Discord.
 *
 * Returned when using 'token' response type (implicit/client-side flow).
 * Contains access token and optional user data.
 *
 * @public
 */
export interface TokenResponse {
    /** Token type (typically 'Bearer') */
    token_type: string;
    /** Discord access token */
    access_token: string;
    /** Token expiration time in seconds */
    expires_in: number;
    /** Array of granted OAuth2 scopes */
    scope: string[];
    /** User profile data (added by this library when fetched) */
    user?: User;
}

/**
 * Callback function type for OAuth2 failures.
 *
 * @param error - Error details from Discord OAuth2 flow
 *
 * @public
 */
export type OnFailureFunc = (error: ErrorResponse) => Promise<void> | void;

/**
 * Callback function type for OAuth2 success.
 *
 * @param response - Success response (either code or token with optional user data)
 *
 * @public
 */
export type OnSuccessFunc = (response: CodeResponse | TokenResponse) => Promise<void> | void;

/**
 * Complete parameters for the useDiscordLogin hook.
 *
 * Extends DiscordLoginParams with callback functions.
 *
 * @public
 */
export type UseDiscordLoginParams = DiscordLoginParams & {
    /** Called when OAuth2 flow completes successfully */
    onSuccess?: OnSuccessFunc;
    /** Called when OAuth2 flow fails or encounters errors */
    onFailure?: OnFailureFunc;
};

/**
 * Type definition for the useDiscordLogin hook function.
 *
 * @param params - Hook configuration parameters
 * @returns Hook return object with buildUrl function and loading state
 *
 * @public
 */
export type UseDiscordLogin = (params: UseDiscordLoginParams) => {
    /** Function to generate Discord OAuth2 authorization URL */
    buildUrl: () => string;
    /** Whether OAuth2 callback is currently being processed */
    isLoading: boolean;
};

/**
 * Discriminated union type for OAuth2 callback responses.
 *
 * Represents the parsed result from a Discord OAuth2 callback URL.
 * The 'type' field determines which optional field contains data.
 *
 * @public
 */
export type CallbackResponse = {
    /** Response type discriminator */
    type: null | 'error' | 'token' | 'code';
    /** Error details (present when type === 'error') */
    error?: ErrorResponse;
    /** Token data (present when type === 'token') */
    token?: TokenResponse;
    /** Code data (present when type === 'code') */
    code?: CodeResponse;
};

/**
 * Function type for parsing OAuth2 callback responses.
 *
 * @returns Parsed callback response from current URL
 *
 * @internal
 */
export type GetCallbackResponseFunc = () => CallbackResponse;
