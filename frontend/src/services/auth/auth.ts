import { signInWithRedirect } from "aws-amplify/auth";

export async function login() {
  await signInWithRedirect();
}