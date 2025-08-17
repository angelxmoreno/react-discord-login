export interface DiscordLoginParams {
    clientId: string;
    redirectUri?: string;
    responseType?: 'token' | 'code';
    scopes?: string[];
}

export interface DiscordLoginConfig extends DiscordLoginParams {
    redirectUri: string;
    responseType: 'token' | 'code';
    scopes: string[];
}

export interface User {
    id: string;
    username: string;
    discriminator: string;
    global_name: string | null;
    avatar: string | null;
    banner: string | null;
    accent_color: string | null;
    locale: string | null;
    verified: boolean;
    email: string | null;
}

export interface ErrorResponse {
    error: string;
    description: string;
}

export interface CodeResponse {
    code: string;
}

export interface TokenResponse {
    token_type: string;
    access_token: string;
    expires_in: number;
    scope: string[];
    user?: User;
}

export type OnFailureFunc = (error: ErrorResponse) => Promise<void> | void;
export type OnSuccessFunc = (response: CodeResponse | TokenResponse) => Promise<void> | void;
export type UseDiscordLoginParams = DiscordLoginParams & {
    onSuccess?: OnSuccessFunc;
    onFailure?: OnFailureFunc;
};
export type UseDiscordLogin = (params: UseDiscordLoginParams) => {
    buildUrl: () => string;
    isLoading: boolean;
};

export type CallbackResponse = {
    type: null | 'error' | 'token' | 'code';
    error?: ErrorResponse;
    token?: TokenResponse;
    code?: CodeResponse;
};
export type GetCallbackResponseFunc = () => CallbackResponse;
