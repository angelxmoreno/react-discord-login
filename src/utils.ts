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

export const getCallbackResponse: GetCallbackResponseFunc = () => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const error = fragment.get('error');
    const error_description = fragment.get('error_description');
    const token_type = fragment.get('token_type');
    const code = query.get('code');

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
                access_token: String(fragment.get('access_token')),
                expires_in: Number(fragment.get('expires_in')),
                scope: String(fragment.get('scope')).split(' '),
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
