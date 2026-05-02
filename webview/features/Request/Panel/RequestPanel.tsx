import React, { FormEvent, useEffect, useRef } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import { COMMON } from "../../../constants/index";
import useStore from "../../../store/useStore";
import RequestButton from "../Button/RequestButton";
import RequestDetailOption from "../Menu/RequestMenu";
import RequestMethod from "../Method/RequestMethod";
import RequestUrl from "../Url/RequestUrl";

const RequestPanel = () => {
  const requestMenuRef = useRef<HTMLDivElement | null>(null);
  const requestData = useStore(
    useShallow((state) => ({
      authData: state.authData,
      authOption: state.authOption,
      apiKeyData: state.apiKeyData,
      oauth2Data: state.oauth2Data,
      requestUrl: state.requestUrl,
      requestMethod: state.requestMethod,
      bodyOption: state.bodyOption,
      bodyRawOption: state.bodyRawOption,
      bodyRawData: state.bodyRawData,
      tableData: state.tableData,
      graphqlData: state.graphqlData,
    }))
  );
  const { requestMenuWidth, handleRequestProcessStatus } = useStore(
    useShallow((state) => ({
      requestMenuWidth: state.requestMenuWidth,
      handleRequestProcessStatus: state.handleRequestProcessStatus,
    }))
  );

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (requestData.requestUrl) {
      handleRequestProcessStatus(COMMON.LOADING);
    }

    vscode.postMessage({ requestData });
  };

  useEffect(() => {
    if (requestMenuRef.current) {
      requestMenuRef.current.style.flex = `0 0 ${requestMenuWidth}`;
    }
  }, [requestMenuWidth]);

  return (
    <RequestPanelWrapper ref={requestMenuRef}>
      <RequestMainForm onSubmit={handleFormSubmit}>
        <RequestMethod />
        <RequestUrl />
        <RequestButton />
      </RequestMainForm>
      <RequestDetailOption />
    </RequestPanelWrapper>
  );
};

const RequestPanelWrapper = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-flow: column;
  overflow: hidden;
  vertical-align: top;
  height: auto;
  max-height: 100vh;
  box-sizing: border-box;

  ::highlight(variable-highlight) {
    background-color: color-mix(in srgb, var(--vscode-editor-background), var(--vscode-editorGutter-addedBackground) 30%);
  }

  ::highlight(non-variable-highlight) {
    background-color: color-mix(in srgb, var(--vscode-editor-background), var(--vscode-editorGutter-deletedBackground) 30%);
  }
`;

const RequestMainForm = styled.form`
  display: flex;
  flex: 0 1 auto;
  margin: 1rem 1.3rem;
`;

export default RequestPanel;
