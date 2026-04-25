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
    variables,
    handleRequestUrlChange,
    handleParamsTableData,
  } = useStore(
    useShallow((state) => ({
      requestUrl: state.requestUrl,
      tableParams: state.tableData.params,
      variables: state.activeVariables,
      handleRequestUrlChange: state.handleRequestUrlChange,
      handleParamsTableData: state.handleParamsTableData,
    }))
  );

  const requestUrlRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLParagraphElement>(null);
  const [displayUrl, setDisplayUrl] = useState("");
  const [caretChar, setCaretChar] = useState("");

  const setVariableHighlight = () => {
    let variableHighlight = CSS.highlights.get("variable-highlight");
    let nonVariableHighlight = CSS.highlights.get("non-variable-highlight");

    const matches = [...displayUrl.matchAll(/\{\{([^}]+)\}\}/gi)];
    const stripBracket = (s: string) => s.replace("{{", "").replace("}}", "");

    const validMatches = matches.filter(match => variables[stripBracket(match[0])]);
    const invalidMatches = matches.filter(match => !variables[stripBracket(match[0])]);
    const rangeCallback = (match: RegExpExecArray) => {
      const range = new Range();
      if (previewRef.current) {
        const textNode = previewRef.current.firstChild;
        range.setStart(textNode!, match.index);
        range.setEnd(textNode!, match.index + match[0].length);
      }
      return range;
    }
    const variableRanges = validMatches.map(rangeCallback);
    if (variableHighlight) {
      for (const range of variableRanges) {
        if (!variableHighlight.has(range)) {
          variableHighlight.add(range);
        }
      }
    } else {
      variableHighlight = new Highlight(...variableRanges);
    }
    CSS.highlights.set("variable-highlight", variableHighlight);

    const nonVariableRanges = invalidMatches.map(rangeCallback);
    if (nonVariableHighlight) {
      for (const range of nonVariableRanges) {
        if (!nonVariableHighlight.has(range)) {
          nonVariableHighlight.add(range);
        }
      }
    } else {
      nonVariableHighlight = new Highlight(...nonVariableRanges);
    }
    CSS.highlights.set("non-variable-highlight", nonVariableHighlight);
  }

  const handleCaretChar = () => {
    const selectionStart = requestUrlRef.current?.selectionStart ?? 0;
    if (selectionStart >= 1) {
      setCaretChar(displayUrl.substring(selectionStart - 1, selectionStart));
    } else {
      setCaretChar("");
    }
  };

  const toUrl = (tableData: ITableRow[]) => {
    const parameterString = generateParameterString(tableData);
    const baseUrl = removeUrlParameter(requestUrl);
    return baseUrl + parameterString;
  };

  const mirrorScroll = () => {
    const inputElement = requestUrlRef.current;
    if (!inputElement) return;

    const previewElement = previewRef.current;
    previewElement?.scrollTo(inputElement?.scrollLeft, inputElement?.scrollTop);
  };

  useEffect(() => {
    const rows = tableParams.filter(d => d.isChecked);
    const newRequestUrl = toUrl(rows);
    if (newRequestUrl !== requestUrl) handleRequestUrlChange(newRequestUrl);

    if (displayUrl.length > 0 && document.activeElement === requestUrlRef.current
      && displayUrl.indexOf("?") === displayUrl.length - 1) {
      return;
    }

    const nonAuthRows = rows.filter(d => !d.authType);
    const newDisplayUrl = toUrl(nonAuthRows);
    if (newDisplayUrl !== displayUrl && caretChar !== "=") setDisplayUrl(newDisplayUrl);
  }, [tableParams]);

  useEffect(() => {
    setVariableHighlight();
    handleCaretChar();

    const urlParams = getUrlParameters(displayUrl);
    if (!urlParams.length || !tableParams.find(p => p.authType)) {
      handleRequestUrlChange(displayUrl);
    }

    const newTableParams = tableParams.map(row => {
      if (row.authType || !row.isChecked) return row;
      const urlParam = urlParams.shift();
      if (urlParam) return { ...row, ...urlParam };
    }).filter(Boolean) as ITableRow[];

    if (urlParams.length) {
      newTableParams.splice(-1, 0, ...urlParams.map(p => ({ isChecked: true, ...p })));
    }
    handleParamsTableData([...newTableParams]);
  }, [displayUrl]);

  return (
    <RequestUrlWrapper>
      <p className="preview" ref={previewRef}>{displayUrl}</p>
      <input
        placeholder="Enter request URL"
        ref={requestUrlRef}
        value={displayUrl}
        onScroll={mirrorScroll}
        onInput={mirrorScroll}
        onChange={(event) => setDisplayUrl(event.target.value)}
      />
    </RequestUrlWrapper>
  );
};

const RequestUrlWrapper = styled.div`
  flex: 1;
  position: relative;
  
  .preview {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid color-mix(in srgb, var(--vscode-focusBorder), transparent 30%);
    background-color: var(--vscode-input-background);
    display: flex;
    align-items: center;
    font-size: 1.15rem;
    padding: 0 0.5rem 0 0.8rem;
    white-space: nowrap;
    overflow: scroll hidden;
    scrollbar-width: none;
    pointer-events: none;
  }

  input {
    position: relative;
    height: 100%;
    font-size: 1.15rem;
    padding-left: 0.85rem !important;
    background: transparent;
    color: transparent;
    caret-color: var(--vscode-foreground);
  }
`;

export default RequestUrl;
