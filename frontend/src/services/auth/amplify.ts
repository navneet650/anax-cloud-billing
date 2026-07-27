import { Amplify } from "aws-amplify";
import { cognitoConfig } from "../../config/cognito";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolClientId,
      loginWith: {
        oauth: {
          domain: cognitoConfig.domain.replace("https://", ""),
          scopes: cognitoConfig.scopes,
          redirectSignIn: [cognitoConfig.redirectSignIn],
          redirectSignOut: [cognitoConfig.redirectSignOut],
          responseType: "code",
        },
      },
    },
  },
});