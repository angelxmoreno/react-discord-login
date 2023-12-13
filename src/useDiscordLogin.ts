import { useEffect, useState } from 'react';

import { UseDiscordLogin } from './DiscordLoginTypes';
import { fetchUser, generateUrl, getCallbackResponse, normalizeDiscordConfig } from './utils';

const useDiscordLogin: UseDiscordLogin = ({ onSuccess, onFailure, ...options }) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const discordConfig = normalizeDiscordConfig(options);
    const url = window.location.hash;

    useEffect(() => {
        const { type, error, token, code } = getCallbackResponse();
        if (type !== null) {
            setLoading(true);
        }
        if (error && onFailure) {
            onFailure(error);
        }
        if (code && onSuccess) {
            onSuccess(code);
        }

        if (token && onSuccess) {
            fetchUser(token).then(user => {
                onSuccess({
                    ...token,
                    user,
                });
            });
        }
        setLoading(false);
    }, [url]);
    const buildUrl = () => generateUrl(discordConfig);
    return {
        buildUrl,
        isLoading,
    };
};

export default useDiscordLogin;
