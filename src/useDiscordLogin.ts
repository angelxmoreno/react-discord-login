import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UseDiscordLogin } from './DiscordLoginTypes';
import { fetchUser, generateUrl, getCallbackResponse, normalizeDiscordConfig, shouldHandleCallback } from './utils';

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
                        const url = new URL(window.location.origin);
                        url.search = '';
                        url.hash = '';
                        history.replaceState(null, '', url);
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
        if (shouldHandleCallback()) {
            handleCallback().catch((error) => {
                console.error('Discord login callback failed:', error);
                if (onFailure && isMountedRef.current) {
                    const failureResult = onFailure({
                        error: 'callback_error',
                        description: error instanceof Error ? error.message : 'Unknown callback error',
                    });
                    if (failureResult instanceof Promise) {
                        failureResult.catch(console.error);
                    }
                }
            });
        }
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
