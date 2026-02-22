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
    handleResponseBodyViewFormat,
    handleRequestProcessStatus,
    handleTreeViewTableData,
    handleTreeViewClick,
  } = useStore(
    useShallow((state) => ({
      responseData: state.responseData,
      requestInProcess: state.requestInProcess,
      handleResponseData: state.handleResponseData,
      handleResponseBodyViewFormat: state.handleResponseBodyViewFormat,
      handleRequestProcessStatus: state.handleRequestProcessStatus,
      handleTreeViewClick: state.handleTreeViewClick,
      handleTreeViewTableData: state.handleTreeViewTableData,
    }))
  );

  /**
   * Format a XML string to pretty-print. Based on a comment to
   * {@link https://stackoverflow.com/a/49458964|this answer} on Stack Overflow.
   * @param xml 
   * @returns The formatted XML string.
   */
  const formatXml = (xml: string) => {
    let formatted = '', indent = '';
    const nodes = xml.slice(1, -1).split(/>\s*</);
    if (nodes[0][0] === '?') {
      formatted += `<${nodes.shift()}>\n`;
    }
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node[0] === '/') {
        indent = indent.slice('\t'.length);
      }
      formatted += `${indent}<${node}>\n`;
      if (node[0] !== '/' && node.at(-1) !== '/' && node.indexOf('</') === -1) {
        indent += '\t';
      }
    }
    return formatted;
  };

  const hasXmlContentType = (headers: { key: string, value: string }[]) =>
    headers.some(({ key, value }) => 
      key.toLowerCase() === "content-type" && value.toLowerCase().includes("application/xml")
    );

  const handleExtensionMessage = (event: MessageEvent) => {
    if (event.data.type === RESPONSE.RESPONSE) {
      if (hasXmlContentType(event.data.headers)) {
        handleResponseData({ ...event.data, body: formatXml(event.data.body) });
        handleResponseBodyViewFormat("XML");
      } else {
        handleResponseData(event.data);
      }
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
