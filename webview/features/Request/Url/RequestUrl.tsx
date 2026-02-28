import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { shallow, useShallow } from "zustand/shallow";

import { REQUEST, RESPONSE } from "../../../constants";
import { ITableRow } from "../../../store/slices/type";
import useStore from "../../../store/useStore";
import { generateParameterString, getUrlParameters, removeUrlParameter, usePrevious } from "../../../utils";

const RequestUrl = () => {
  const {
    requestUrl,
    tableParams,
    handleRequestUrlChange,
    handleParamsTableData,
  } = useStore(
    useShallow((state) => ({
      requestUrl: state.requestUrl,
      tableParams: state.tableData["Params"],
      handleRequestUrlChange: state.handleRequestUrlChange,
      handleParamsTableData: state.handleParamsTableData,
    }))
  );

  const removeFirstParam = (url: string) => {
    const searchIndex = url.indexOf("?");
    if (searchIndex === -1) {
      return url;
    }
    
    const baseUrl = url.slice(0, searchIndex);
    const paramStr = url.slice(searchIndex + 1);

    const firstDelimiterIndex = paramStr.indexOf("&");
    const newParamStr = paramStr.slice(firstDelimiterIndex + 1);
    return `${baseUrl}?${newParamStr}`;
  }

  const initDisplayUrl = () => tableParams.some(d => d.authType) ? removeFirstParam(requestUrl) : requestUrl;

  const [displayUrl, setDisplayUrl] = useState(initDisplayUrl);
  const prevTableData = usePrevious(tableParams);
  const prevDisplayUrl = usePrevious(displayUrl);

  const toUrl = (tableData: ITableRow[]) => {
    const parameterString = generateParameterString(tableData.map(d => ({ ...d, optionType: REQUEST.PARAMS })));
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
    if (prevTableData.length !== tableParams.length
      || prevTableData.some((param, i) => !shallow(param, tableParams[i]))
    ) {
      const rows = tableParams.filter(d => d.isChecked);
      handleRequestUrlChange(toUrl(rows));

      const nonAuthRows = rows.filter(d => !d.authType);
      setDisplayUrl(toUrl(nonAuthRows));

      return;
    }

    // Case 2: Request URL changed
    if (prevDisplayUrl !== displayUrl) {
      const urlParams = getUrlParameters(displayUrl);
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
      }).filter(Boolean) as ITableRow[];

      if (urlParams.length) {
        newTableParams.splice(-1, 0, ...urlParams.map(p => ({
          id: crypto.randomUUID(),
          isChecked: true,
          key: p.key,
          value: p.value,
          rowReadOnly: false,
        })));
      }

      handleParamsTableData([...newTableParams]);
    }
  }, [tableParams, displayUrl]);

  return (
    <InputContainer
      placeholder="Enter request URL"
      value={displayUrl}
      onChange={(event) => setDisplayUrl(event.target.value)}
    />
  );
};

const InputContainer = styled.input`
  padding-left: 0.85rem !important;
  font-size: 1.15rem;
  border: 1px solid color-mix(in srgb, var(--vscode-focusBorder), transparent 30%) !important;
  color: var(--vscode-foreground);
`;

export default RequestUrl;
