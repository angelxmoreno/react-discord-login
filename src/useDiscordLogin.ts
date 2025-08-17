import { useCallback, useEffect, useState } from 'react';

import type { UseDiscordLogin } from './DiscordLoginTypes';
import { fetchUser, generateUrl, getCallbackResponse, normalizeDiscordConfig, shouldHandleCallback } from './utils';

const useDiscordLogin: UseDiscordLogin = ({ onSuccess, onFailure, ...options }) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const discordConfig = normalizeDiscordConfig(options);

    const handleCallback = useCallback(async () => {
        const { type, error, token, code } = getCallbackResponse();
        if (type !== null) {
            setLoading(true);
            const url = new URL(window.location.origin);
            url.search = '';
            url.hash = '';
            history.replaceState(null, '', url);
        }
        if (error && onFailure) {
            await onFailure(error);
        }
        if (code && onSuccess) {
            await onSuccess(code);
        }

        if (token && onSuccess) {
            const user = await fetchUser(token);
            await onSuccess({
                ...token,
                user,
            });
        }
        if (type !== null) {
            setLoading(false);
        }
    }, [onFailure, onSuccess]);

    useEffect(() => {
        if (shouldHandleCallback()) {
            handleCallback().catch(console.error);
        }
    }, [handleCallback]);

    const buildUrl = () => generateUrl(discordConfig);
    return {
        buildUrl,
        isLoading,
    };
};

export default useDiscordLogin;
