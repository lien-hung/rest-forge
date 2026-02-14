import React, { useEffect, useState } from "react";
import { SyncLoader } from "react-spinners";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import Button from "../../../components/Button";
import InputWrapper from "../../../components/InputWrapper";
import Wrapper from "../../../components/Wrapper";

import clockIcon from "../../../assets/svg/clock-icon.svg";
import errorIcon from "../../../assets/svg/validate-error.svg";
import { COMMON, OPTION, REQUEST } from "../../../constants";
import { IOAuth2Token } from "../../../store/slices/type";
import useStore from "../../../store/useStore";
import { refreshOAuth2Token } from "../../../utils/getOAuth2Token";
import RequestOAuth2NewToken from "./RequestOAuth2NewToken";

const RequestOAuth2 = () => {
  const {
    tokens,
    setTokens,
    keyValueTableData,
    addAuthTableRow,
    removeAuthTableRow,
    handleRequestValue,
    handleHeaderPrefix,
  } = useStore(
    useShallow((state) => ({
      tokens: state.oauth2Tokens,
      setTokens: state.setOAuth2Tokens,
      keyValueTableData: state.keyValueTableData,
      addAuthTableRow: state.addAuthTableRow,
      removeAuthTableRow: state.removeAuthTableRow,
      handleRequestValue: state.handleRequestValue,
      handleHeaderPrefix: state.handleHeaderPrefix,
    }))
  );

  const tokenRow = keyValueTableData.find(
    (d) => d.authType === REQUEST.ACCESS_TOKEN || d.authType === REQUEST.ID_TOKEN
  );
  const tokenRowPrefix = tokenRow?.prefix || "Bearer";
  const initialToken = tokenRow?.value || "";

  const [addTo, setAddTo] = useState(
    tokenRow
      ? (tokenRow.optionType === COMMON.HEADERS
        ? REQUEST.ADD_TO_HEADERS
        : REQUEST.ADD_TO_QUERY_PARAMS)
      : REQUEST.ADD_TO_HEADERS
  );
  const [token, setToken] = useState(
    addTo === REQUEST.ADD_TO_HEADERS
      ? initialToken.slice(tokenRowPrefix.length + 1)
      : initialToken
  );
  const [headerPrefix, setHeaderPrefix] = useState(tokenRowPrefix);
  const [tokenType, setTokenType] = useState(tokenRow?.authType || REQUEST.ACCESS_TOKEN);
  const [selectedIndex, setSelectedIndex] = useState(
    tokens.findIndex(t => t.access_token === token || t.id_token === token) + 1
  );
  const [isRefreshPending, setIsRefreshPending] = useState(false);

  const selectedToken = tokens[selectedIndex - 1];
  const tokenHeader = `${headerPrefix} ${token}`;

  const isTokenExpired = (token: IOAuth2Token) => {
    return Date.now() >= token.timestamp + token.expires_in * 1000;
  };

  const getExpiryTime = (token: IOAuth2Token) => {
    const dateObj = new Date(token.timestamp + token.expires_in * 1000);
    return dateObj.toLocaleString();
  };

  const setAuthTableRow = () => {
    removeAuthTableRow();
    if (token) {
      if (addTo === REQUEST.ADD_TO_HEADERS) {
        addAuthTableRow(tokenType, COMMON.HEADERS, REQUEST.AUTH, tokenHeader, headerPrefix);
      } else {
        addAuthTableRow(tokenType, REQUEST.PARAMS, "access_token", token);
      }
    }
  };

  const handleRefreshToken = async () => {
    if (!selectedToken) return;

    const refreshRequest = {
      accessTokenUrl: selectedToken.access_token_url,
      refreshToken: selectedToken.refresh_token,
      clientId: selectedToken.client_id,
      clientSecret: selectedToken.client_secret
    };
    const credentials = await refreshOAuth2Token(refreshRequest);
    if (credentials.error) {
      throw new Error(`Refresh token failed: ${credentials.error}`);
    }

    const newToken = { ...selectedToken, ...credentials, timestamp: new Date().getTime() };
    const newTokenList = tokens.map((t, i) => i === selectedIndex - 1 ? newToken : t);
    setTokens(newTokenList);
    vscode.postMessage({ command: COMMON.SET_OAUTH2_TOKENS, newTokenList });

    if (tokenType === REQUEST.ACCESS_TOKEN) {
      setToken(newToken.access_token);
    } else {
      setToken(newToken.id_token);
    }
    setIsRefreshPending(false);
  };

  useEffect(() => setAuthTableRow(), [selectedIndex, addTo]);

  useEffect(() => {
    if (!token) return;

    if (!tokenRow) {
      setAuthTableRow();
    } else {
      if (addTo === REQUEST.ADD_TO_HEADERS) {
        handleRequestValue(tokenRow.id, tokenHeader);
      } else {
        handleRequestValue(tokenRow.id, token);
      }
    }
  }, [token]);

  useEffect(() => {
    if (tokenRow && addTo === REQUEST.ADD_TO_HEADERS) {
      handleHeaderPrefix(tokenRow.id, headerPrefix);
      handleRequestValue(tokenRow.id, tokenHeader);
    }
  }, [headerPrefix]);

  useEffect(() => {
    if (isRefreshPending) handleRefreshToken();
  }, [isRefreshPending]);

  return (
    <Wrapper>
      <h2>Current Token</h2>
      <InputWrapper>
        <label htmlFor="token">Token:</label>
        <TokenWrapper>
          <OptionWrapper
            value={token}
            onChange={(event) => {
              setSelectedIndex(event.target.selectedIndex);
              setToken(event.target.value);
            }}
          >
            <option key="emptyToken" value="">
              {tokens.length > 0 ? "Select token" : "No tokens available"}
            </option>
            {tokens.map((token) => (
              <option
                key={token.timestamp}
                value={
                  tokenType === REQUEST.ACCESS_TOKEN
                    ? token.access_token
                    : token.id_token
                }
              >
                {token.name}
              </option>
            ))}
          </OptionWrapper>
          <Button
            primary={false}
            handleButtonClick={() =>
              vscode.postMessage({ command: COMMON.OPEN_MANAGE_TOKENS })
            }
          >
            Manage
          </Button>
        </TokenWrapper>
      </InputWrapper>
      {selectedIndex > 0 && (
        <InputWrapper>
          <label htmlFor="tokenType">Token Type:</label>
          <OptionWrapper
            value={tokenType}
            onChange={(event) => {
              setTokenType(event.target.value);
              if (event.target.value === REQUEST.ACCESS_TOKEN) {
                setToken(selectedToken?.access_token || "");
              } else {
                setToken(selectedToken?.id_token || "");
              }
            }}
          >
            {OPTION.OAUTH2_TOKEN_TYPES.map((option, index) => (
              <option key={REQUEST.TOKEN_TYPE + index} value={option}>
                {option}
              </option>
            ))}
          </OptionWrapper>
        </InputWrapper>
      )}
      <InputWrapper>
        {/* Label intentionally left blank */}
        <label></label>
        <SelectTokenWrapper>
          <input
            type="text"
            name="token"
            placeholder="Token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          {selectedToken && (isRefreshPending ? (
            <div>
              <SyncLoader
                color="var(--vscode-foreground)"
                speedMultiplier={0.5}
                size="0.5rem"
                cssOverride={OPTION.LOADER_CSS_OPTIONS}
              />
              <TokenMessage role="message">Refreshing token...</TokenMessage>
            </div>
          ) : (
            <div>
              {isTokenExpired(selectedToken) ? (
                <>
                  <img src={errorIcon} />
                  <TokenMessage role="alert">Token expired.</TokenMessage>
                </>
              ) : (
                <>
                  <img src={clockIcon} />
                  <TokenMessage role="message">Token expires at {getExpiryTime(selectedToken)}.</TokenMessage>
                </>
              )}
              <a onClick={() => setIsRefreshPending(true)}>Refresh</a>
            </div>
          ))}
        </SelectTokenWrapper>
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="prefix">Header Prefix:</label>
        <input
          name="prefix"
          placeholder="e.g. Bearer"
          value={headerPrefix}
          onChange={(event) => setHeaderPrefix(event.target.value)}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="prefix">Add to:</label>
        <OptionWrapper
          value={addTo}
          onChange={(event) => setAddTo(event.target.value)}
        >
          {OPTION.ADD_TO_OPTIONS.map((option, index) => (
            <option key={REQUEST.ADD_TO_OPTION + index} value={option}>
              {option}
            </option>
          ))}
        </OptionWrapper>
      </InputWrapper>
      <RequestOAuth2NewToken />
    </Wrapper>
  );
};

const OptionWrapper = styled.select`
  height: 2.5rem;
  border: 0.1rem solid rgba(128, 128, 128, 0.7);
  border-radius: 0.3rem;
  padding: 0.1rem 0.3rem;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-foreground);
`;

const TokenWrapper = styled.div`
  display: flex;
  flex: 1;

  button {
    flex: 0 1 auto;
  }
`;

const SelectTokenWrapper = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;

  a {
    margin-left: 0.3rem;
    font-size: 0.9rem;
    cursor: pointer;
  }

  div {
    display: flex;
    align-items: center;
    margin-top: 0.5rem;
  }

  span[role="alert"] {
    color: var(--vscode-editorError-foreground, #ff4d4d);
  }
`;

const TokenMessage = styled.span`
  color: var(--vscode-foreground);
  font-size: 0.9rem;
  margin-left: 0.5rem;
`;

export default RequestOAuth2;