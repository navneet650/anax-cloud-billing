export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  domain: import.meta.env.VITE_COGNITO_DOMAIN,
  redirectSignIn: import.meta.env.VITE_REDIRECT_URI,
  redirectSignOut: import.meta.env.VITE_LOGOUT_URI,
  responseType: "code",
  scopes: ["openid", "email"],
};