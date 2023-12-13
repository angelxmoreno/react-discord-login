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
import { useDiscordLogin, UseDiscordLoginParams } from 'react-discord-login';

const YourComponent = () => {
    const discordLoginParams: UseDiscordLoginParams = {
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

Several TypeScript types are provided to enhance code quality and development experience:

-   **DiscordLoginParams**
-   **DiscordLoginConfig**
-   **User**
-   **ErrorResponse**
-   **CodeResponse**
-   **TokenResponse**
-   **UseDiscordLoginParams**
-   **OnSuccessFunc**
-   **OnFailureFunc**
-   **GetCallbackResponseFunc**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
