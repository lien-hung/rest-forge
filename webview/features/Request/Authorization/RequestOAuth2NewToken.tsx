import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import errorIcon from "../../../assets/svg/validate-error.svg";
import Button from "../../../components/Button";
import InputWrapper from "../../../components/InputWrapper";
import { COMMON, OPTION, REQUEST } from "../../../constants";
import {
  getCodeChallenge,
  getCodeVerifier,
  getOAuth2TokenByAuthorizationCode,
  getOAuth2TokenByClientCreds,
  showError
} from "../../../utils";
import { IOAuth2Request } from "../../../utils/type";
import useStore from "../../../store/useStore";

const RequestOAuth2NewToken = () => {
  const { tokens, setTokens } = useStore(
    useShallow((state) => ({
      tokens: state.oauth2Tokens,
      setTokens: state.setOAuth2Tokens,
    }))
  );

  const [grantType, setGrantType] = useState(REQUEST.AUTH_CODE);
  const tokenRequestRef = useRef<IOAuth2Request>(undefined);

  const [codeVerifierError, setCodeVerifierError] = useState("");
  const [codeVerifierValue, setCodeVerifierValue] = useState("");
  const [invalidChars, setInvalidChars] = useState<string[]>([]);

  const CODE_VERIFIER_ALLOWED = /^[A-Za-z0-9\-\.\_\~]+$/;
  const getInvalidCharacters = (value: string) =>
    Array.from(new Set(value.split("").filter((c) => !CODE_VERIFIER_ALLOWED.test(c))));

  const validateCodeVerifier = (value: string) => {
    setCodeVerifierValue(value);
    if (!value) {
      setCodeVerifierError("");
      setInvalidChars([]);
      return true;
    }
    if (value.length < 43 || value.length > 128) {
      setCodeVerifierError("The length must be within 43 to 128 characters long.");
      setInvalidChars(getInvalidCharacters(value));
      return false;
    }
    const bad = getInvalidCharacters(value);
    if (bad.length) {
      setCodeVerifierError(
        `This field contains characters which are not valid. Use the following valid characters: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~".`
      );
      setInvalidChars(bad);
      return false;
    }
    setCodeVerifierError("");
    setInvalidChars([]);
    return true;
  };

  // Configuration option refs
  const tokenNameRef = useRef<HTMLInputElement>(null);
  const callbackUrlRef = useRef<HTMLInputElement>(null);
  const authUrlRef = useRef<HTMLInputElement>(null);
  const accessTokenUrlRef = useRef<HTMLInputElement>(null);
  const clientIdRef = useRef<HTMLInputElement>(null);
  const clientSecretRef = useRef<HTMLInputElement>(null);
  const challengeTypeRef = useRef<HTMLSelectElement>(null);
  const scopeRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const clientAuthRef = useRef<HTMLSelectElement>(null);

  // Content editable refs
  const codeVerifierRef = useRef<HTMLInputElement>(null);
  const codeVerifierPreviewRef = useRef<HTMLDivElement>(null);

  // Advanced option refs
  const resourceRef = useRef<HTMLInputElement>(null);
  const audienceRef = useRef<HTMLInputElement>(null);

  const addToken = (credentials: any) => {
    const newToken = {
      name: tokenNameRef.current?.value,
      ...credentials,
      access_token_url: accessTokenUrlRef.current?.value,
      client_id: clientIdRef.current?.value,
      client_secret: clientSecretRef.current?.value,
      timestamp: new Date().getTime(),
    };
    setTokens([...tokens, newToken]);
    vscode.postMessage({
      command: COMMON.SET_OAUTH2_TOKENS,
      newTokenList: [...tokens, newToken]
    });
    vscode.postMessage({ command: COMMON.OAUTH2_TOKEN_ADDED });
  };

  const mirrorScroll = () => {
    const inputElement = codeVerifierRef.current;
    if (!inputElement) return;

    const previewElement = codeVerifierPreviewRef.current;
    previewElement?.scrollTo(inputElement?.scrollLeft, inputElement?.scrollTop);
  };

  const handleGetToken = async () => {
    if (!tokenNameRef.current) {
      showError("You must specify a token name.");
      return;
    }

    const tokenRequest: IOAuth2Request = {
      authorizationUrl: authUrlRef.current?.value || "",
      accessTokenUrl: accessTokenUrlRef.current?.value || "",
      callbackUrl: callbackUrlRef.current?.value || "",
      clientId: clientIdRef.current?.value || "",
      clientSecret: clientSecretRef.current?.value || "",
      credsPlacement: clientAuthRef.current?.value === REQUEST.SEND_BASIC_AUTH ? 'basic_auth_header' : '',
      pkce: grantType === REQUEST.AUTH_CODE_PKCE,
      codeVerifier: codeVerifierValue,
      challengeType: challengeTypeRef.current?.value,
      scope: scopeRef.current?.value,
      state: stateRef.current?.value,
    };

    if (grantType === REQUEST.CLIENT_CREDS) {
      const credentials = await getOAuth2TokenByClientCreds(tokenRequest);
      if (credentials.error) {
        showError(`An error occurred during authorization: ${credentials.error} (${credentials.error_description})`);
        return;
      }
      addToken(credentials);
    } else {
      if (!tokenRequest.authorizationUrl) {
        showError("Authorization URL is required.");
        return;
      }
      if (!tokenRequest.accessTokenUrl) {
        showError("Access token URL is required.");
        return;
      }
      if (!tokenRequest.clientId) {
        showError("Client ID is required.");
        return;
      }

      // Get code verifier
      if (tokenRequest.pkce) {
        if (tokenRequest.codeVerifier) {
          const userVerifier = tokenRequest.codeVerifier;
          if (!validateCodeVerifier(userVerifier)) {
            showError("The code verifier does not conform with the RFC7636 spec. See https://datatracker.ietf.org/doc/html/rfc7636#section-4.1 for reference.");
            return;
          }
        } else {
          tokenRequest.codeVerifier = getCodeVerifier();
        }
      }

      const codeVerifier = tokenRequest.codeVerifier || "";
      const codeChallenge = tokenRequest.challengeType === "SHA-256" 
        ? await getCodeChallenge(codeVerifier)
        : codeVerifier;

      tokenRequestRef.current = tokenRequest;
      vscode.postMessage({ tokenRequest, codeChallenge, command: COMMON.OAUTH2_TOKEN_REQUEST });
    }
  };

  const handleExtensionMessage = async (event: MessageEvent) => {
    if (event.data.type === COMMON.OAUTH2_TOKEN_RESPONSE && tokenRequestRef.current) {
      const authorizationCode = event.data.code;
      const credentials = await getOAuth2TokenByAuthorizationCode(tokenRequestRef.current, authorizationCode);
      if (credentials.error) {
        showError(`An error occurred during authorization: ${credentials.error} (${credentials.error_description})`);
        return;
      }
      addToken(credentials);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleExtensionMessage);
  }, []);

  return (
    <ConfigMenuWrapper>
      <h2>Configure New Token</h2>
      <h3>Configuration Options</h3>
      <InputWrapper>
        <label htmlFor="tokenName">Token Name</label>
        <input
          type="text"
          name="tokenName"
          defaultValue="access_token"
          placeholder="Enter a token name..."
          ref={tokenNameRef}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="grantType">Grant Type</label>
        <OptionWrapper value={grantType} onChange={(event) => setGrantType(event.target.value)}>
          {OPTION.OAUTH2_GRANT_TYPES.map((option, index) => (
            <option key={REQUEST.GRANT_TYPE + index} value={option}>
              {option}
            </option>
          ))}
        </OptionWrapper>
      </InputWrapper>
      {grantType !== REQUEST.CLIENT_CREDS && (
        <>
          <InputWrapper>
            <label htmlFor="callbackUrl">Callback URL</label>
            <input
              type="text"
              name="callbackUrl"
              required
              defaultValue="https://lien-hung.github.io/oauth2/callback"
              ref={callbackUrlRef}
            />
          </InputWrapper>
          <InputWrapper>
            <label htmlFor="authUrl">Auth URL</label>
            <input
              type="text"
              name="authUrl"
              required
              placeholder="https://example.com/login/oauth/authorize"
              ref={authUrlRef}
            />
          </InputWrapper>
        </>
      )}
      <InputWrapper>
        <label htmlFor="accessTokenUrl">Token URL</label>
        <input
          type="text"
          name="accessTokenUrl"
          required
          placeholder="https://example.com/login/oauth/access_token"
          ref={accessTokenUrlRef}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="clientId">Client ID</label>
        <input
          type="text"
          name="clientId"
          required
          placeholder="Client ID"
          ref={clientIdRef}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="clientSecret">Client Secret</label>
        <input
          type="text"
          name="clientSecret"
          placeholder="Client Secret"
          ref={clientSecretRef}
        />
      </InputWrapper>
      {grantType === REQUEST.AUTH_CODE_PKCE && (
        <>
          <InputWrapper>
            <label htmlFor="challengeType">Challenge Type</label>
            <OptionWrapper ref={challengeTypeRef}>
              {OPTION.OAUTH2_PKCE_METHODS.map((option, index) => (
                <option key={REQUEST.CHALLENGE_TYPE + index} value={option}>
                  {option}
                </option>
              ))}
            </OptionWrapper>
          </InputWrapper>
          <InputWrapper>
            <label htmlFor="codeVerifier">Code Verifier</label>
            <CodeVerifierWrapper>
              <Preview ref={codeVerifierPreviewRef}>
                {Array.from(codeVerifierValue).map((ch, i) => {
                  const isInvalid = invalidChars.includes(ch);
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <Char key={i} $invalid={isInvalid}>
                      {ch}
                    </Char>
                  );
                })}
              </Preview>
              <input
                ref={codeVerifierRef}
                type="text"
                name="codeVerifier"
                placeholder="Automatically generated if left blank"
                value={codeVerifierValue}
                onChange={(e) => validateCodeVerifier(e.target.value)}
                onScroll={mirrorScroll}
                onInput={mirrorScroll}
                aria-invalid={!!codeVerifierError}
              />
              {codeVerifierError && (
                <div>
                  <img src={errorIcon} />
                  <ErrorText role="alert">{codeVerifierError}</ErrorText>
                </div>
              )}
            </CodeVerifierWrapper>
          </InputWrapper>
        </>
      )}
      <InputWrapper>
        <label htmlFor="scope">Scope</label>
        <input
          type="text"
          name="scope"
          placeholder="e.g. read:org"
          ref={scopeRef}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="state">State</label>
        <input
          type="text"
          name="state"
          placeholder="State"
          ref={stateRef}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="clientAuth">Client Auth</label>
        <OptionWrapper ref={clientAuthRef}>
          {OPTION.OAUTH2_CLIENT_AUTH_OPTIONS.map((option, index) => (
            <option key={REQUEST.CLIENT_AUTH_OPTION + index} value={option}>
              {option}
            </option>
          ))}
        </OptionWrapper>
      </InputWrapper>
      <h3>Advanced Options</h3>
      <InputWrapper>
        <label htmlFor="resource">Resource</label>
        <input
          type="text"
          name="resource"
          placeholder="Resource"
          ref={resourceRef}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="audience">Audience</label>
        <input
          type="text"
          name="audience"
          placeholder="Audience"
          ref={audienceRef}
        />
      </InputWrapper>
      <Button primary handleButtonClick={handleGetToken}>
        Get New Token
      </Button>
    </ConfigMenuWrapper>
  );
};

const OptionWrapper = styled.select`
  width: auto;
  height: 2.5rem;
  border: 0.1rem solid rgba(128 128 128 / 0.7);
  border-radius: 0.3rem;
  padding: 0.1rem 0.3rem;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-foreground);
`;

const ErrorText = styled.span`
  color: var(--vscode-editorError-foreground, #ff4d4d);
  font-size: 0.9rem;
  margin-left: 0.5rem;
`;

const CodeVerifierWrapper = styled.div`
  flex: 1;
  position: relative;

  input {
    position: relative;
    outline: none;
    color: transparent;
    caret-color: var(--vscode-foreground);
  }

  input[aria-invalid=true] {
    border: 1px solid var(--vscode-editorError-foreground, #ff4d4d);
  }
`;

const Preview = styled.div`
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border: 1px solid transparent;
  padding: 0.5rem 0.7rem;
  user-select: none;
  overflow: scroll;
  overflow-y: hidden;
  scrollbar-width: none;
  white-space: nowrap;
`;

const Char = styled.span<{ $invalid?: boolean }>`
  padding-right: 0.01rem;
  ${'' /* subtle highlight for invalid chars */}
  ${({ $invalid }) =>
    $invalid
      ? `background: rgba(255 77 77 / 0.12);
        color: var(--vscode-editorError-foreground, #ff4d4d);
        border-radius: 2px;`
      : `color: inherit;`}
`;

const ConfigMenuWrapper = styled.div`
  margin-bottom: 2rem;
`;

export default RequestOAuth2NewToken;