import { signInWithRedirect } from "aws-amplify/auth";
import { cognitoConfig } from "../../config/cognito";

export async function login() {
  console.log("Scopes:", cognitoConfig.scopes);
  await signInWithRedirect();
}