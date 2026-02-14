import React, { useEffect, useState } from "react";
import styled from "styled-components";

import TokenDetails from "../features/Tokens/TokenDetails";
import TokenList from "../features/Tokens/TokenList";

import { COMMON } from "../constants";
import useStore from "../store/useStore";

const ManageTokensPage = () => {
  const setTokens = useStore((state) => state.setOAuth2Tokens);
  const [selectedTimestamp, setSelectedTimestamp] = useState(0);

  const handleExtensionMessage = (event: MessageEvent) => {
    if (event.data.type === COMMON.HAS_OAUTH2_TOKENS) {
      const tokens = event.data.tokenList;
      setTokens(tokens);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleExtensionMessage);
    vscode.postMessage({ command: COMMON.INIT_OAUTH2_TOKENS });
  }, []);

  return (
    <ManageTokensWrapper>
      <Sidebar>
        <TokenList
          selectedTimestamp={selectedTimestamp}
          onSelect={(timestamp) => setSelectedTimestamp(timestamp)}
        />
      </Sidebar>
      <Details>
        <TokenDetails selectedTimestamp={selectedTimestamp} />
      </Details>
    </ManageTokensWrapper>
  );
};

const ManageTokensWrapper = styled.div`
  display: flex;
  height: 100vh;
  color: var(--vscode-foreground);
`

const Sidebar = styled.aside`
  min-width: 14rem;
  border-right: 2px solid rgba(128, 128, 128, 0.12);
  overflow-y: auto;
  scrollbar-width: none;
`;

const Details = styled.main`
  flex: 1 1 auto;
  overflow: auto;
`;

export default ManageTokensPage;