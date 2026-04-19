import React, { useEffect } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import RequestPanel from "../features/Request/Panel/RequestPanel";
import ResizeBar from "../features/ResizeBar/ResizeBar";
import ResponsePanel from "../features/Response/Panel/ResponsePanel";

import { COMMON, REQUEST } from "../constants";
import useStore from "../store/useStore";

function MainPage() {
  const {
    setThemeKind,
    setConfig,
    setOAuth2Tokens,
    setActiveVariables,
  } = useStore(
    useShallow((state) => ({
      setThemeKind: state.setThemeKind,
      setConfig: state.setConfig,
      setOAuth2Tokens: state.setOAuth2Tokens,
      setActiveVariables: state.setActiveVariables,
    }))
  );
  
  const handleExtensionMessage = (event: MessageEvent) => {
    if (event.data.type === COMMON.HAS_CONFIG) {
      setConfig(event.data.config);
      setThemeKind(event.data.themeKind);
    } else if (event.data.type === COMMON.HAS_OAUTH2_TOKENS) {
      setOAuth2Tokens(event.data.tokenList);
    } else if (event.data.type === REQUEST.ENV_DATA) {
      console.log("Variables:", event.data.variables);
      setActiveVariables(event.data.variables);
    } else if (event.data.type === COMMON.THEME_CHANGED) {
      setThemeKind(event.data.themeKind);
    }
  };
  
  useEffect(() => {
    window.addEventListener("message", handleExtensionMessage);
    vscode.postMessage({ command: COMMON.INIT_CONFIG });
    vscode.postMessage({ command: COMMON.INIT_OAUTH2_TOKENS });
  }, []);

  return (
    <MainPageWrapper>
      <RequestPanel />
      <ResizeBar />
      <ResponsePanel />
    </MainPageWrapper>
  );
};

const MainPageWrapper = styled.div`
  display: flex;
`

export default MainPage;