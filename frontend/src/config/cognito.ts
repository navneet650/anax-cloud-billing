export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  domain: import.meta.env.VITE_COGNITO_DOMAIN,
  // Dynamically use current origin — works on app.anaxenterprise.com, amplifyapp.com, and localhost
  redirectSignIn: typeof window !== "undefined" ? window.location.origin : "",
  redirectSignOut: typeof window !== "undefined" ? window.location.origin : "",
  responseType: "code",
  scopes: ["openid", "email", "profile"],
};