import * as vscode from "vscode";
import { IOAuth2Request } from "./type";

export default async function authorizeInBrowser(request: IOAuth2Request, codeChallenge: string) {
  const fullAuthUrl = new URL(request.authorizationUrl);
  fullAuthUrl.searchParams.append('response_type', 'code');
  fullAuthUrl.searchParams.append('client_id', request.clientId);

  if (request.callbackUrl) {
    fullAuthUrl.searchParams.append('redirect_uri', request.callbackUrl);
  }

  if (request.scope) {
    fullAuthUrl.searchParams.append('scope', request.scope);
  }

  if (request.pkce) {
    fullAuthUrl.searchParams.append('code_challenge', codeChallenge);
    fullAuthUrl.searchParams.append('code_challenge_method', request.challengeType === "SHA-256" ? 'S256' : 'plain');
  }

  if (request.state) {
    fullAuthUrl.searchParams.append('state', request.state);
  }

  const authUri = vscode.Uri.parse(fullAuthUrl.toString());
  vscode.env.openExternal(authUri);
}