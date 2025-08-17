# react-discord-login

`react-discord-login` is a lightweight and flexible React component for easy integration of "Sign in with Discord" functionality into your web applications. Empower your users to log in seamlessly using their Discord accounts.

## Installation

```bash
npm install react-discord-login
//or
yarn add react-discord-login
//or
bun add react-discord-login
```

## Usage

```tsx
import { 
    useDiscordLogin, 
    type DiscordLoginParams,
    type CodeResponse,
    type TokenResponse,
    type ErrorResponse 
} from 'react-discord-login';

const YourComponent = () => {
    const discordLoginParams: DiscordLoginParams & {
        onSuccess?: (response: CodeResponse | TokenResponse) => void;
        onFailure?: (error: ErrorResponse) => void;
    } = {
        clientId: 'YOUR_DISCORD_CLIENT_ID',
        redirectUri: 'YOUR_REDIRECT_URI',
        responseType: 'token', // or 'code'
        scopes: ['identify', 'email'],
        onSuccess: response => {
            // Handle successful login
            console.log('Login successful:', response);
        },
        onFailure: error => {
            // Handle login failure
            console.error('Login failed:', error);
        },
    };

    const { buildUrl, isLoading } = useDiscordLogin(discordLoginParams);

    return (
        <div>
            <button onClick={() => (window.location.href = buildUrl())} disabled={isLoading}>
                Sign in with Discord
            </button>
        </div>
    );
};
```

## API Reference

### useDiscordLogin

```ts
type UseDiscordLogin = (params: UseDiscordLoginParams) => {
    buildUrl: () => string;
    isLoading: boolean;
};
```

#### Parameters:

-   **params**: An object containing Discord login parameters and optional callback functions.
-   **clientId**: Discord application client ID.
-   **redirectUri**: Redirect URI for the OAuth2 flow.
-   **responseType**: Response type ('token' or 'code').
-   **scopes**: Array of requested OAuth2 scopes.
-   **onSuccess**: Callback function for successful login.
-   **onFailure**: Callback function for login failure.

#### Returns:

An object with the following properties:

-   **buildUrl**: Function to build the Discord login URL.
-   **isLoading**: Boolean indicating whether the login process is in progress.

## Types

All TypeScript types are exported to enhance code quality and development experience:

### Core Types
-   **DiscordLoginParams** - Configuration parameters for Discord OAuth2
-   **DiscordLoginConfig** - Normalized configuration (internal use)
-   **User** - Discord user data structure

### Response Types  
-   **ErrorResponse** - OAuth2 error response structure
-   **CodeResponse** - Authorization code response (for 'code' flow)
-   **TokenResponse** - Access token response (for 'token' flow)

### Callback Types
-   **OnSuccessFunc** - Type for success callback function
-   **OnFailureFunc** - Type for failure callback function

### Hook Types
-   **UseDiscordLogin** - Type definition for the main hook
-   **CallbackResponse** - Internal callback response structure

### Example with Types

```tsx
import { 
    useDiscordLogin,
    type OnSuccessFunc,
    type OnFailureFunc,
    type TokenResponse,
    type ErrorResponse 
} from 'react-discord-login';

const handleSuccess: OnSuccessFunc = (response) => {
    if ('access_token' in response) {
        // Handle token response
        const tokenResponse = response as TokenResponse;
        console.log('Access token:', tokenResponse.access_token);
        if (tokenResponse.user) {
            console.log('User:', tokenResponse.user);
        }
    } else {
        // Handle code response  
        console.log('Authorization code:', response.code);
    }
};

const handleFailure: OnFailureFunc = (error: ErrorResponse) => {
    console.error('Login failed:', error.error, error.description);
};
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
