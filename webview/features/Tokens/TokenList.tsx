import React from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import useStore from "../../store/useStore";
import deleteIcon from "../../assets/svg/delete-icon.svg";
import { COMMON } from "../../constants";

interface TokenListProps {
  selectedTimestamp: number;
  onSelect: (timestamp: number) => void;
}

const TokenList = ({ selectedTimestamp, onSelect }: TokenListProps) => {
  const { tokens, setTokens } = useStore(
    useShallow((state) => ({
      tokens: state.oauth2Tokens,
      setTokens: state.setOAuth2Tokens,
    }))
  );

  const handleDelete = (timestamp: number) => {
    const filteredTokens = tokens.filter((t) => t.timestamp !== timestamp);
    setTokens(filteredTokens);
    vscode.postMessage({ command: COMMON.SET_OAUTH2_TOKENS, newTokenList: filteredTokens });
  };

  return (
    <List>
      {tokens.map((token) => (
        <Item
          key={token.id_token}
          active={selectedTimestamp === token.timestamp}
          isExpired={Date.now() >= token.timestamp + token.expires_in * 1000}
          onClick={() => onSelect(token.timestamp)}
        >
          <span className="tokenName">{token.name}</span>
          <button
            className="delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(token.timestamp);
            }}
          >
            <img src={deleteIcon} alt="delete" />
          </button>
        </Item>
      ))}
    </List>
  );
};

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Item = styled.div<{ active?: boolean, isExpired?: boolean }>`
  padding: 0.85rem 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: ${(p) => (p.active ? "rgba(128 128 128 / 0.08)" : "transparent")};
  border-left: ${(p) => (p.active && "3px solid var(--vscode-button-background)")};

  .tokenName {
    color: var(--vscode-foreground);
    opacity: ${(p) => (p.isExpired && "0.7")};
    text-decoration: ${(p) => (p.isExpired && "line-through")};
  }

  .delete {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: auto;

    img {
      opacity: 0.8;
    }
  }

  &:hover {
    background: rgba(128 128 128 / 0.08);
    
    .delete {
      display: inline-block;
    }
  }
`

export default TokenList;