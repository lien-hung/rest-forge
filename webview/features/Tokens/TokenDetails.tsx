import React, { useMemo } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import connectionIcon from "../../assets/svg/connection.svg";
import Message from "../../components/Message";
import useStore from "../../store/useStore";

const TokenDetails = ({ selectedTimestamp }: { selectedTimestamp: number }) => {
  const { tokens } = useStore(useShallow((state) => ({ tokens: state.oauth2Tokens })));

  const token = useMemo(() => {
    if (!selectedTimestamp) return undefined;
    return tokens.find((t) => t.timestamp === selectedTimestamp);
  }, [tokens, selectedTimestamp]);

  if (!token) {
    return (
      <Message primary>
        <img src={connectionIcon} alt="Connection SVG" />
        <h3 className="introMessage">
          {tokens.length ? "Select a token to see its details" : "No tokens available"}
        </h3>
      </Message>
    );
  }
  
  return (
    <Container>
      <TopRow>
        <h3>Token Details</h3>
        {(Date.now() >= token.timestamp + token.expires_in * 1000) && (
          <div className="expired">
            <p>(Expired)</p>
          </div>
        )}
      </TopRow>

      <Field>
        {Object.entries(token).map(([key, value]) => (
          <>
            <label>{key}</label>
            <TokenArea>
              <pre>{value}</pre>
            </TokenArea>
          </>
        ))}
      </Field>
    </Container>
  );
};

const Container = styled.div`
  padding: 1.2rem;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h3 {
    margin: 0;
  }

  .expired {
    display: flex;
    gap: 0.6rem;
    font-style: italic;
    color: rgb(255 100 100);
  }
`;

const Field = styled.div`
  margin-top: 1rem;
  
  label {
    opacity: 0.8;
    display: block;
    margin-bottom: 0.5rem;
  }
`;

const TokenArea = styled.div`
  background: var(--vscode-editor-background);
  border: 1px solid rgba(128 128 128 / 0.14);
  padding: 0.8rem;
  overflow: auto;
  margin-bottom: 0.8rem;
  
  pre {
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    font-family: monospace;
  }
`;

export default TokenDetails;