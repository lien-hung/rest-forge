import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { shallow, useShallow } from "zustand/shallow";

import { REQUEST, RESPONSE } from "../../../constants";
import useStore from "../../../store/useStore";
import { KeyValueTableData } from "../../../store/slices/type";
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
    const toUrl = (tableData: KeyValueTableData[]) => {
      const parameterString = generateParameterString(tableData);
      const baseUrl = removeUrlParameter(displayUrl || requestUrl);
      return baseUrl + parameterString;
    };

    // Case 1: Table data changed
    if (prevTableData.length !== keyValueTableData.length
      || prevTableData.some((param, i) => !shallow(param, keyValueTableData[i]))
    ) {
      // Set new request URL
      const tableData = keyValueTableData.filter(
        d => d.optionType === REQUEST.PARAMS && d.isChecked
      );
      const newUrl = toUrl(tableData);
      handleRequestUrlChange(newUrl);

      // Set display URL
      if (tableData.some(d => d.authType)) {
        setDisplayUrl(toUrl(tableData.filter(d => !d.authType)));
      } else {
        setDisplayUrl(newUrl);
      }
      return;
    }

    // Case 2: Request URL changed
    if (prevDisplayUrl !== displayUrl) {
      const prevUrlParams = getUrlParameters(prevDisplayUrl);
      const urlParams = getUrlParameters(displayUrl);
      const urlParamsCount = urlParams.length;
      const allParams = keyValueTableData.filter(d => d.optionType === REQUEST.PARAMS);

      const authParam = allParams.find(p => p.authType);
      if (urlParamsCount === 0 && !authParam) {
        handleRequestUrlChange(displayUrl);
      } else if (prevUrlParams.every((param, i) => shallow(param, urlParams[i]))) {
        const newUrl = toUrl(allParams.filter(p => p.isChecked));
        handleRequestUrlChange(newUrl);
      }

      // Map existing URL parameters to rows
      const urlTableParams = allParams.filter(p => !p.authType);
      let newParams = urlTableParams.map(p => {
        if (!p.isChecked || urlParams.length === 0) return p;
        const urlParam = urlParams.shift();
        return urlParam ? { ...p, key: urlParam.key, value: urlParam.value } : p;
      });

      if (urlParams.length > 0) {
        newParams.splice(-1, 0, ...urlParams.map(p => ({
          id: crypto.randomUUID(),
          optionType: REQUEST.PARAMS,
          isChecked: true,
          key: p.key,
          value: p.value,
          rowReadOnly: false,
        })));
      } else {
        // Remove excess params from the end of URL
        const toRemoveCount = newParams.filter(p => p.isChecked).length - urlParamsCount;
        const toRemove: KeyValueTableData[] = [];
        for (let i = newParams.length - 1; i >= 0 && toRemove.length < toRemoveCount; i--) {
          if (newParams[i].isChecked) toRemove.push(newParams[i]);
        }
        newParams = newParams.filter(p => !toRemove.some(r => r.id === p.id));
      }

      const otherRows = keyValueTableData.filter(d => d.optionType !== REQUEST.PARAMS);
      if (authParam) {
        handleTreeViewTableData([authParam, ...newParams, ...otherRows]);
      } else {
        handleTreeViewTableData([...newParams, ...otherRows]);
      }
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
