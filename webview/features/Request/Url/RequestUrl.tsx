import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import { ITableRow } from "../../../store/slices/type";
import useStore from "../../../store/useStore";
import {
  generateParameterString,
  getUrlParameters,
  removeUrlParameter,
} from "../../../utils";

const RequestUrl = () => {
  const {
    requestUrl,
    tableParams,
    handleRequestUrlChange,
    handleParamsTableData,
  } = useStore(
    useShallow((state) => ({
      requestUrl: state.requestUrl,
      tableParams: state.tableData.params,
      handleRequestUrlChange: state.handleRequestUrlChange,
      handleParamsTableData: state.handleParamsTableData,
    }))
  );

  const requestUrlRef = useRef<HTMLInputElement>(null);
  const [displayUrl, setDisplayUrl] = useState("");

  const toUrl = (tableData: ITableRow[]) => {
    const parameterString = generateParameterString(tableData);
    const baseUrl = removeUrlParameter(requestUrl);
    return baseUrl + parameterString;
  };

  useEffect(() => {
    const rows = tableParams.filter(d => d.isChecked);
    const newRequestUrl = toUrl(rows);
    if (newRequestUrl !== requestUrl) {
      handleRequestUrlChange(newRequestUrl);
    }

    const urlLen = displayUrl.length;
    if (urlLen > 0 && document.activeElement === requestUrlRef.current
      && (displayUrl.indexOf("?") === urlLen - 1 || displayUrl.endsWith("="))) {
      return;
    }

    const nonAuthRows = rows.filter(d => !d.authType);
    const newDisplayUrl = toUrl(nonAuthRows);
    if (newDisplayUrl !== displayUrl) {
      setDisplayUrl(newDisplayUrl);
    }
  }, [tableParams]);

  useEffect(() => {
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
      newTableParams.splice(-1, 0, ...urlParams.map(p => ({ isChecked: true, key: p.key, value: p.value })));
    }
    handleParamsTableData([...newTableParams]);
  }, [displayUrl]);

  return (
    <InputContainer
      placeholder="Enter request URL"
      ref={requestUrlRef}
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
