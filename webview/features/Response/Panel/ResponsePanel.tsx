import React, { useEffect } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import Loader from "../../../components/Loader";
import { COMMON, RESPONSE } from "../../../constants/index";
import useStore from "../../../store/useStore";
import ResponseEmptyMenu from "../Empty/ResponseEmptyMenu";
import ResponseErrorMenu from "../Error/ResponseErrorMenu";
import ResponseMenu from "../Menu/ResponseMenu";
import ResponseMenuOption from "../Menu/ResponseMenuOption";

const ResponsePanel = () => {
  const {
    responseData,
    requestInProcess,
    handleResponseData,
    handleRequestProcessStatus,
    handleTreeViewTableData,
    handleTreeViewClick,
  } = useStore(
    useShallow((state) => ({
      responseData: state.responseData,
      requestInProcess: state.requestInProcess,
      handleResponseData: state.handleResponseData,
      handleRequestProcessStatus: state.handleRequestProcessStatus,
      handleTreeViewClick: state.handleTreeViewClick,
      handleTreeViewTableData: state.handleTreeViewTableData,
    }))
  );

  const handleExtensionMessage = (event: MessageEvent) => {
    if (event.data.type === RESPONSE.RESPONSE) {
      handleResponseData(event.data);
      handleRequestProcessStatus(COMMON.FINISHED);
    } else if (event.data.type === RESPONSE.ERROR) {
      handleResponseData(event.data);
      handleRequestProcessStatus(RESPONSE.ERROR);
    } else if (event.data.type === RESPONSE.TREEVIEW_DATA) {
      const {
        tableData,
        authData,
        authOption,
        oauth2Data,
        requestUrl,
        requestMethod,
        bodyOption,
        bodyRawOption,
        bodyRawData,
      } = event.data;

      handleTreeViewClick({
        authData,
        authOption,
        oauth2Data,
        requestUrl,
        requestMethod,
        bodyOption,
        bodyRawOption,
        bodyRawData,
      });

      handleTreeViewTableData(tableData);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleExtensionMessage);
  }, []);

  switch (requestInProcess) {
    case COMMON.LOADING:
      return (
        <ResponsePanelWrapper>
          <ResponseMenu />
          <Loader />
        </ResponsePanelWrapper>
      );
    case COMMON.FINISHED:
      return (
        <ResponsePanelWrapper>
          <ResponseMenu />
          <ResponseMenuOption />
        </ResponsePanelWrapper>
      );
    case RESPONSE.ERROR:
      return (
        <ResponsePanelWrapper>
          <ResponseMenu />
          <ResponseErrorMenu {...responseData} />
        </ResponsePanelWrapper>
      );
    default:
      return (
        <ResponsePanelWrapper>
          <ResponseMenu />
          <ResponseEmptyMenu />
        </ResponsePanelWrapper>
      );
  }
};

const ResponsePanelWrapper = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-flow: column;
  overflow: hidden;
  vertical-align: top;
  height: auto;
  max-height: 100vh;
  box-sizing: border-box;
`;

export default ResponsePanel;
