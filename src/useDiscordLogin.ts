import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UseDiscordLogin } from './DiscordLoginTypes';
import { fetchUser, generateUrl, getCallbackResponse, normalizeDiscordConfig, shouldHandleCallback } from './utils';

/**
 * React hook for Discord OAuth2 authentication flow.
 *
 * Provides a complete OAuth2 integration with Discord's API, supporting both 'code' and 'token' flows.
 * Handles URL callback processing, user data fetching, error handling, and navigation state preservation.
 *
 * @example
 * ```tsx
 * // Basic usage with code flow
 * const { buildUrl, isLoading } = useDiscordLogin({
 *   clientId: 'your-discord-client-id',
 *   redirectUri: 'https://yourapp.com/callback',
 *   responseType: 'code',
 *   scopes: ['identify', 'email'],
 *   onSuccess: (response) => {
 *     console.log('OAuth success:', response);
 *   },
 *   onFailure: (error) => {
 *     console.error('OAuth failed:', error);
 *   }
 * });
 *
 * // Token flow with user data
 * const { buildUrl, isLoading } = useDiscordLogin({
 *   clientId: 'your-discord-client-id',
 *   responseType: 'token',
 *   scopes: ['identify'],
 *   onSuccess: (response) => {
 *     // response includes user data for token flow
 *     console.log('User:', response.user);
 *   }
 * });
 * ```
 *
 * @param params - Configuration object for Discord OAuth2
 * @param params.clientId - Discord application client ID (18-19 digit snowflake)
 * @param params.redirectUri - OAuth2 redirect URI (defaults to current origin)
 * @param params.responseType - OAuth2 response type: 'code' or 'token' (defaults to 'code')
 * @param params.scopes - Discord OAuth2 scopes array (defaults to ['identify'])
 * @param params.onSuccess - Callback for successful OAuth2 completion
 * @param params.onFailure - Callback for OAuth2 errors
 *
 * @returns Hook return object
 * @returns returns.buildUrl - Function to generate Discord OAuth2 authorization URL
 * @returns returns.isLoading - Boolean indicating if OAuth2 callback is being processed
 *
 * @remarks
 * This hook automatically:
 * - Detects OAuth2 callbacks in the current URL (query params or hash fragments)
 * - Processes callbacks on mount and URL changes (hashchange/popstate events)
 * - Fetches user data for token flow responses
 * - Cleans OAuth2 parameters from URL while preserving navigation state
 * - Prevents memory leaks with proper cleanup and mount tracking
 * - Works in SSR environments with safe window/history access
 *
 * @since 2.1.0
 */
const useDiscordLogin: UseDiscordLogin = ({ onSuccess, onFailure, clientId, redirectUri, responseType, scopes }) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const isMountedRef = useRef<boolean>(true);
    const discordConfig = useMemo(
        () => normalizeDiscordConfig({ clientId, redirectUri, responseType, scopes }),
        [clientId, redirectUri, responseType, scopes]
    );

    const handleCallback = useCallback(async () => {
        let type: null | 'error' | 'token' | 'code' = null;
        let error: ReturnType<typeof getCallbackResponse>['error'];
        let token: ReturnType<typeof getCallbackResponse>['token'];
        let code: ReturnType<typeof getCallbackResponse>['code'];

        try {
            const response = getCallbackResponse();
            type = response.type;
            error = response.error;
            token = response.token;
            code = response.code;

            if (type !== null && isMountedRef.current) {
                setLoading(true);
                try {
                    if (typeof window !== 'undefined' && typeof history !== 'undefined') {
                        // OAuth parameters to remove
                        const oauthParams = [
                            'code',
                            'state',
                            'error',
                            'error_description',
                            'access_token',
                            'token_type',
                            'expires_in',
                            'scope',
                        ];

                        // Preserve current pathname
                        const currentPathname = window.location.pathname;

                        // Clean up search params
                        const searchParams = new URLSearchParams(window.location.search);
                        for (const param of oauthParams) {
                            searchParams.delete(param);
                        }
                        const sanitizedSearch = searchParams.toString();

                        // Clean up hash params (Discord OAuth can use hash fragments)
                        let sanitizedHash = '';
                        if (window.location.hash) {
                            const hashContent = window.location.hash.substring(1); // Remove leading #
                            const hashParams = new URLSearchParams(hashContent);
                            for (const param of oauthParams) {
                                hashParams.delete(param);
                            }
                            const cleanHashParams = hashParams.toString();
                            sanitizedHash = cleanHashParams ? `#${cleanHashParams}` : '';
                        }

                        // Reconstruct URL preserving non-OAuth data
                        const reconstructedUrl =
                            currentPathname + (sanitizedSearch ? `?${sanitizedSearch}` : '') + sanitizedHash;

                        history.replaceState(null, '', reconstructedUrl);
                    }
                } catch {
                    // noop: environment lacks URL/history support
                }
            }
            if (error && onFailure && isMountedRef.current) {
                await onFailure(error);
            }

            if (code && onSuccess && isMountedRef.current) {
                await onSuccess(code);
            }

            if (token && onSuccess && isMountedRef.current) {
                const user = await fetchUser(token);
                if (isMountedRef.current) {
                    await onSuccess({
                        ...token,
                        user,
                    });
                }
            }
        } catch (callbackError) {
            if (onFailure && isMountedRef.current) {
                await onFailure({
                    error: 'callback_error',
                    description: callbackError instanceof Error ? callbackError.message : 'Unknown callback error',
                });
            }
        } finally {
            if (type !== null && isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [onFailure, onSuccess]);

    useEffect(() => {
        // Define a single guarded async runner closure
        const callbackRunner = async () => {
            if (shouldHandleCallback()) {
                try {
                    await handleCallback();
                } catch (error) {
                    console.error('Discord login callback failed:', error);
                    if (onFailure && isMountedRef.current) {
                        await onFailure({
                            error: 'callback_error',
                            description: error instanceof Error ? error.message : 'Unknown callback error',
                        });
                    }
                }
            }
        };

        // Run on mount
        callbackRunner();

        // Add event listeners for URL changes
        const handleHashChange = () => callbackRunner();
        const handlePopState = () => callbackRunner();

        if (typeof window !== 'undefined') {
            window.addEventListener('hashchange', handleHashChange);
            window.addEventListener('popstate', handlePopState);
        }

        // Cleanup listeners
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('hashchange', handleHashChange);
                window.removeEventListener('popstate', handlePopState);
            }
        };
    }, [handleCallback, onFailure]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const buildUrl = useCallback(() => generateUrl(discordConfig), [discordConfig]);

    return {
        buildUrl,
        isLoading,
    };
};

export default useDiscordLogin;
