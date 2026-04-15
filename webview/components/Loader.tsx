import React from "react";
import styled from "styled-components";

const Loader = () => {
  return (
    <LoaderWrapper>
      <h2>Sending request...</h2>
      <span className="loader"></span>
    </LoaderWrapper>
  );
};

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 35vh;

  h2 {
    margin: 6.5rem 0 2.2rem 0;
    opacity: 0.85;
  }

  .loader {
    position: relative;
    border: 0.85rem solid #0000;
    border-radius: 50%;
    animation: piefill 1s linear infinite;
  }

  @keyframes piefill {
    0%, 19% {
      border-color: #0000;
    }
    
    20%, 39% {
      border-color: #0000;
      border-top-color: var(--vscode-foreground);
    }
    
    40%, 59% {
      border-color: #0000;
      border-top-color: var(--vscode-foreground);
      border-right-color: var(--vscode-foreground);
    }
    
    60%, 79% {
      border-color: var(--vscode-foreground);
      border-left-color: #0000;
    }
    
    80%, 100% {
      border-color: var(--vscode-foreground);
    }
  }
`;

export default Loader;
