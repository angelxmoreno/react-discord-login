import {
    DiscordLoginConfig,
    DiscordLoginParams,
    GetCallbackResponseFunc,
    TokenResponse,
    User,
} from './DiscordLoginTypes';

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

export const generateUrl = ({ clientId, redirectUri, responseType, scopes }: DiscordLoginConfig) => {
    const searchParams = new URLSearchParams();
    searchParams.append('client_id', clientId);
    searchParams.append('response_type', responseType);
    searchParams.append('redirect_uri', redirectUri);
    searchParams.append('scope', scopes.join(' '));

    return 'https://discord.com/api/oauth2/authorize?' + searchParams.toString();
};

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

export const fetchUser = async (token: TokenResponse) => {
    const result = await fetch('https://discord.com/api/users/@me', {
        headers: {
            authorization: `${token.token_type} ${token.access_token}`,
        },
    });
    return (await result.json()) as User;
};

export const shouldHandleCallback = (): boolean => {
    const params = getQueryAndHash();
    const keys = Array.from(params.keys());
    const targets = ['code', 'error', 'token_type'];
    return targets.some(target => keys.includes(target));
};
