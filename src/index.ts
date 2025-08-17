import useDiscordLogin from './useDiscordLogin';

// Export the hook as both default and named export
export default useDiscordLogin;
export { useDiscordLogin };

// Export types
export type {
    CallbackResponse,
    CodeResponse,
    DiscordLoginConfig,
    DiscordLoginParams,
    ErrorResponse,
    OnFailureFunc,
    OnSuccessFunc,
    TokenResponse,
    UseDiscordLogin,
    User,
} from './DiscordLoginTypes';
