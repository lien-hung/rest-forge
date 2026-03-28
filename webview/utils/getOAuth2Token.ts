import cryptoRandomString from "crypto-random-string";
import showError from "./showError";
import { IOAuth2RefreshRequest, IOAuth2Request } from "./type";

export function getCodeVerifier() {
  return cryptoRandomString({ length: 44, type: "url-safe" });
}

export async function getCodeChallenge(codeVerifier: string): Promise<string> {
  const codeVerifierBuffer = new TextEncoder().encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', codeVerifierBuffer); // @ts-expect-error
  const base64Hash = new Uint8Array(hashBuffer).toBase64()
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return base64Hash;
}

export async function getOAuth2TokenByAuthorizationCode(request: IOAuth2Request, authorizationCode: string) {
  const oAuth = structuredClone(request);
  const url = oAuth.accessTokenUrl;

  // Set headers
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };
  if (oAuth.credsPlacement === 'basic_auth_header') {
    const secret = oAuth.clientSecret ?? '';
    headers['Authorization'] = `Basic ${Buffer.from(`${oAuth.clientId}:${secret}`).toString('base64')}`;
  }

  // Set data
  const data: { [key: string]: string } = {
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: oAuth.callbackUrl
  };
  if (oAuth.credsPlacement !== 'basic_auth_header') {
    data['client_id'] = oAuth.clientId;
    if (oAuth.clientSecret && oAuth.clientSecret.trim()) {
      data['client_secret'] = oAuth.clientSecret;
    }
  }
  if (oAuth.pkce && oAuth.codeVerifier) {
    data['code_verifier'] = oAuth.codeVerifier;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: new URLSearchParams(data)
    });
    const credentials = await response.json();
    return credentials;
  } catch (error: any) {
    return { error: error.message, description: error.error_description };
  }
}

export async function getOAuth2TokenByClientCreds(request: IOAuth2Request) {
  const oAuth = structuredClone(request);
  const url = oAuth.accessTokenUrl;

  if (!url) {
    showError("Access token URL is required.");
    return;
  }
  if (!oAuth.clientId) {
    showError("Client ID is required.");
    return;
  }

  // Set headers
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };
  if (oAuth.credsPlacement === 'basic_auth_header') {
    const secret = oAuth.clientSecret ?? '';
    headers['Authorization'] = `Basic ${Buffer.from(`${oAuth.clientId}:${secret}`).toString('base64')}`;
  }

  // Set data
  const data: { [key: string]: string } = {
    grant_type: 'client_credentials'
  };
  if (oAuth.credsPlacement !== 'basic_auth_header') {
    data['client_id'] = oAuth.clientId;
    if (oAuth.clientSecret && oAuth.clientSecret.trim()) {
      data['client_secret'] = oAuth.clientSecret;
    }
  }
  if (oAuth.scope && oAuth.scope.trim()) {
    data.scope = oAuth.scope;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: new URLSearchParams(data)
    });
    const credentials = await response.json();
    return credentials;
  } catch (error: any) {
    return { error: error.message, description: error.error_description };
  }
}

export async function refreshOAuth2Token(request: IOAuth2RefreshRequest) {
  const url = request.accessTokenUrl;
  const data = {
    grant_type: 'refresh_token',
    refresh_token: request.refreshToken,
    client_id: request.clientId,
    client_secret: request.clientSecret
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data)
    });
    const credentials = await response.json();
    return credentials;
  } catch (error: any) {
    return { error: error.message, description: error.error_description };
  }
}