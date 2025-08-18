/**
 * @fileoverview React Discord Login - OAuth2 hook for Discord authentication
 *
 * A React hook library providing complete Discord OAuth2 integration with automatic
 * callback handling, user data fetching, and navigation state preservation.
 *
 * @example Basic usage
 * ```tsx
 * import { useDiscordLogin } from 'react-discord-login';
 *
 * function LoginButton() {
 *   const { buildUrl, isLoading } = useDiscordLogin({
 *     clientId: 'your-discord-client-id',
 *     redirectUri: 'https://yourapp.com/callback',
 *     scopes: ['identify', 'email'],
 *     onSuccess: (response) => {
 *       console.log('Login successful:', response);
 *     },
 *     onFailure: (error) => {
 *       console.error('Login failed:', error);
 *     }
 *   });
 *
 *   return (
 *     <button onClick={() => window.location.href = buildUrl()}>
 *       {isLoading ? 'Processing...' : 'Login with Discord'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

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
    UseDiscordLoginParams,
    User,
} from './DiscordLoginTypes';
