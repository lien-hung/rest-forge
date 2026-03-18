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
import { IOAuth2Token, ITableRow } from "../../../store/slices/type";
import useStore from "../../../store/useStore";
import { refreshOAuth2Token } from "../../../utils/getOAuth2Token";
import RequestOAuth2NewToken from "./RequestOAuth2NewToken";

const RequestOAuth2 = () => {
  const {
    tableData,
    tokens,
    setTokens,
    oauth2,
    setOAuth2,
    addAuthTableRow,
    removeAuthTableRow,
    handleRequestValue,
    handleHeaderPrefix,
  } = useStore(
    useShallow((state) => ({
      tableData: state.tableData,
      tokens: state.oauth2Tokens,
      setTokens: state.setOAuth2Tokens,
      oauth2: state.oauth2Data,
      setOAuth2: state.setOAuth2Data,
      addAuthTableRow: state.addAuthTableRow,
      removeAuthTableRow: state.removeAuthTableRow,
      handleRequestValue: state.handleRequestValue,
      handleHeaderPrefix: state.handleHeaderPrefix,
    }))
  );

  const isToken = (row: ITableRow) => row.authType === REQUEST.ACCESS_TOKEN || row.authType === REQUEST.ID_TOKEN

  const tokenRowHeader = tableData["Headers"].find(isToken);
  const tokenRowParam = tableData["Params"].find(isToken);
  const tokenRow = tokenRowHeader || tokenRowParam;

  const [selectedIndex, setSelectedIndex] = useState(
    tokens.findIndex(t => t.access_token === oauth2.token || t.id_token === oauth2.token) + 1
  );
  const [isRefreshPending, setIsRefreshPending] = useState(false);

  const selectedToken = tokens[selectedIndex - 1];
  const tokenHeader = `${oauth2.prefix} ${oauth2.token}`;

  const isTokenExpired = (token: IOAuth2Token) => {
    return Date.now() >= token.timestamp + token.expires_in * 1000;
  };

  const getExpiryTime = (token: IOAuth2Token) => {
    const dateObj = new Date(token.timestamp + token.expires_in * 1000);
    return dateObj.toLocaleString();
  };

  const setAuthTableRow = () => {
    removeAuthTableRow("Headers");
    removeAuthTableRow("Params");

    if (oauth2.token) {
      if (oauth2.addTo === REQUEST.ADD_TO_HEADERS) {
        addAuthTableRow(oauth2.tokenType, "Headers", { key: REQUEST.AUTH, value: tokenHeader, prefix: oauth2.prefix });
      } else {
        addAuthTableRow(oauth2.tokenType, "Params", { key: "access_token", value: oauth2.token });
      }
    }
  };

  const handleRefreshToken = async () => {
    if (!selectedToken) return;
    if (!selectedToken.refresh_token) return;

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

    if (oauth2.tokenType === REQUEST.ACCESS_TOKEN) {
      setOAuth2({ ...oauth2, token: newToken.access_token });
    } else {
      setOAuth2({ ...oauth2, token: newToken.id_token });
    }
    setIsRefreshPending(false);
  };

  const handleExtensionMessage = (event: MessageEvent) => {
    if (event.data.type === COMMON.HAS_OAUTH2_TOKENS) {
      const newTokenList = event.data.tokenList as IOAuth2Token[];
      if (!selectedToken || newTokenList.findIndex((t) => t.timestamp === selectedToken.timestamp) === -1) {
        setSelectedIndex(0);
        setOAuth2({ ...oauth2, token: "" });
      }
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleExtensionMessage);
  }, []);

  useEffect(() => {
    if (selectedToken && !selectedToken.id_token) {
      setOAuth2({ ...oauth2, token: selectedToken.access_token, tokenType: REQUEST.ACCESS_TOKEN });
    }
  }, [selectedIndex]);

  useEffect(() => setAuthTableRow(), [selectedIndex, oauth2.addTo, oauth2.tokenType]);

  useEffect(() => {
    if (!oauth2.token) {
      removeAuthTableRow("Headers");
      removeAuthTableRow("Params");
      return;
    }

    if (!tokenRow) {
      setAuthTableRow();
    } else {
      if (oauth2.addTo === REQUEST.ADD_TO_HEADERS) {
        handleRequestValue("Headers", tokenRow.id, tokenHeader);
      } else {
        handleRequestValue("Params", tokenRow.id, oauth2.token);
      }
    }
  }, [oauth2.token]);

  useEffect(() => {
    if (tokenRow && oauth2.addTo === REQUEST.ADD_TO_HEADERS) {
      handleHeaderPrefix(tokenRow.id, oauth2.prefix);
      handleRequestValue("Headers", tokenRow.id, tokenHeader);
    }
  }, [oauth2.prefix]);

  useEffect(() => { if (isRefreshPending) handleRefreshToken(); }, [isRefreshPending]);

  return (
    <Wrapper>
      <h2>Current Token</h2>
      <InputWrapper>
        <label htmlFor="token">Token:</label>
        <TokenWrapper>
          <OptionWrapper
            value={oauth2.token}
            onChange={(event) => {
              setSelectedIndex(event.target.selectedIndex);
              setOAuth2({ ...oauth2, token: event.target.value })
            }}
          >
            <option key="emptyToken" value="">
              {tokens.length > 0 ? "Select token" : "No tokens available"}
            </option>
            {tokens.map((token) => (
              <option
                key={token.timestamp}
                value={
                  oauth2.tokenType === REQUEST.ACCESS_TOKEN
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
      {selectedToken && selectedToken.id_token && (
        <InputWrapper>
          <label htmlFor="tokenType">Token Type:</label>
          <OptionWrapper
            value={oauth2.tokenType}
            onChange={(event) => {
              const newData = {
                token: event.target.value === REQUEST.ACCESS_TOKEN
                  ? selectedToken.access_token
                  : selectedToken.id_token!,
                tokenType: event.target.value,
              };
              setOAuth2({ ...oauth2, ...newData });
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
            value={oauth2.token}
            onChange={(event) => setOAuth2({ ...oauth2, token: event.target.value })}
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
              {selectedToken.refresh_token && (
                <a onClick={() => setIsRefreshPending(true)}>Refresh</a>
              )}
            </div>
          ))}
        </SelectTokenWrapper>
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="prefix">Header Prefix:</label>
        <input
          name="prefix"
          placeholder="e.g. Bearer"
          value={oauth2.prefix}
          onChange={(event) => setOAuth2({ ...oauth2, prefix: event.target.value })}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="prefix">Add to:</label>
        <OptionWrapper
          value={oauth2.addTo}
          onChange={(event) => setOAuth2({ ...oauth2, addTo: event.target.value })}
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
  border: 0.1rem solid rgba(128 128 128 / 0.7);
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