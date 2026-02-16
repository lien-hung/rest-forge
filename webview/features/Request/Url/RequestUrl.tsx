import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { shallow, useShallow } from "zustand/shallow";

import { REQUEST, RESPONSE } from "../../../constants";
import { KeyValueTableData } from "../../../store/slices/type";
import useStore from "../../../store/useStore";
import { generateParameterString, removeUrlParameter, usePrevious } from "../../../utils";
import getUrlParameters from "../../../utils/getUrlParameters";

const RequestUrl = () => {
  const {
    requestUrl,
    keyValueTableData,
    handleRequestUrlChange,
    handleTreeViewTableData,
  } = useStore(
    useShallow((state) => ({
      requestUrl: state.requestUrl,
      keyValueTableData: state.keyValueTableData,
      handleRequestUrlChange: state.handleRequestUrlChange,
      handleTreeViewTableData: state.handleTreeViewTableData,
    }))
  );

  const removeFirstParam = (url: string) => {
    const [baseUrl, paramStr] = url.split("?");
    const firstDelimiterIndex = paramStr.indexOf("&");
    const newParamStr = paramStr.slice(firstDelimiterIndex + 1);
    return `${baseUrl}?${newParamStr}`;
  }

  const initDisplayUrl = () =>
    keyValueTableData.some(d => d.optionType === REQUEST.PARAMS && d.authType)
      ? removeFirstParam(requestUrl)
      : requestUrl;

  const [displayUrl, setDisplayUrl] = useState(initDisplayUrl);
  const prevTableData = usePrevious(keyValueTableData);
  const prevDisplayUrl = usePrevious(displayUrl);

  const toUrl = (tableData: KeyValueTableData[]) => {
    const parameterString = generateParameterString(tableData);
    const baseUrl = removeUrlParameter(displayUrl || requestUrl);
    return baseUrl + parameterString;
  };

  const handleExtensionMessage = (event: MessageEvent) => {
    if (event.data.type === RESPONSE.TREEVIEW_DATA) {
      const newDisplayUrl = initDisplayUrl();
      setDisplayUrl(newDisplayUrl);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleExtensionMessage);
  }, []);

  useEffect(() => {
    // Case 1: Table data changed
    if (prevTableData.length !== keyValueTableData.length
      || prevTableData.some((param, i) => !shallow(param, keyValueTableData[i]))
    ) {
      const rows = keyValueTableData.filter(d => d.optionType === REQUEST.PARAMS && d.isChecked);
      handleRequestUrlChange(toUrl(rows));

      const nonAuthRows = rows.filter(d => !d.authType);
      setDisplayUrl(toUrl(nonAuthRows));

      return;
    }

    // Case 2: Request URL changed
    if (prevDisplayUrl !== displayUrl) {
      const urlParams = getUrlParameters(displayUrl);
      const tableParams = keyValueTableData.filter(d => d.optionType === REQUEST.PARAMS);

      if (!urlParams.length || !tableParams.find(p => p.authType)) {
        handleRequestUrlChange(displayUrl);
      }

      const newTableParams = tableParams.map(row => {
        if (row.authType || !row.isChecked) {
          return row;
        }
        const urlParam = urlParams.shift();
        if (urlParam) {
          return { ...row, key: urlParam.key, value: urlParam.value };
        }
      }).filter(Boolean) as KeyValueTableData[];

      if (urlParams.length) {
        newTableParams.splice(-1, 0, ...urlParams.map(p => ({
          id: crypto.randomUUID(),
          optionType: REQUEST.PARAMS,
          isChecked: true,
          key: p.key,
          value: p.value,
          rowReadOnly: false,
        })));
      }

      const otherRows = keyValueTableData.filter(d => d.optionType !== REQUEST.PARAMS);
      handleTreeViewTableData([...newTableParams, ...otherRows]);
    }
  }, [keyValueTableData, displayUrl]);

  return (
    <InputContainer
      placeholder="Enter request URL"
      value={displayUrl}
      onChange={(event) => setDisplayUrl(event.target.value)}
    />
  );
};

const InputContainer = styled.input`
  padding-left: 1rem;
  font-size: 1.15rem;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-foreground);
`;

export default RequestUrl;
