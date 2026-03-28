// @ts-ignore
import codegen from "postman-code-generators";
import React, { ChangeEvent, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useDebounce } from "use-debounce";
import { useShallow } from "zustand/shallow";

import CopyIcon from "../../../components/CopyIcon";
import SelectWrapper from "../../../components/SelectWrapper";
import { COMMON, OPTION } from "../../../constants/index";
import CodeEditor from "../../../shared/CodeEditor";
import useStore from "../../../store/useStore";
import { generateSdkRequestObject } from "../../../utils/index";
import { BodyOptionType } from "../../../utils/type";

const RequestCodeSnippet = () => {
  const {
    authData,
    authOption,
    requestMethod,
    requestUrl,
    bodyOption,
    bodyRawData,
    graphqlData,
    codeSnippetValue,
    codeSnippetOption,
    tableData,
    setCodeSnippetValue,
    handleCodeSnippetOptionChange,
    handleCodeSnippetVariantChange,
  } = useStore(
    useShallow((state) => ({
      authData: state.authData,
      authOption: state.authOption,
      requestMethod: state.requestMethod,
      requestUrl: state.requestUrl,
      bodyOption: state.bodyOption as BodyOptionType,
      bodyRawData: state.bodyRawData,
      graphqlData: state.graphqlData,
      codeSnippetValue: state.codeSnippetValue,
      codeSnippetOption: state.codeSnippetOption,
      tableData: state.tableData,
      setCodeSnippetValue: state.setCodeSnippetValue,
      handleCodeSnippetOptionChange: state.handleCodeSnippetOptionChange,
      handleCodeSnippetVariantChange: state.handleCodeSnippetVariantChange,
    }))
  );

  const DEBOUNCE_TIME_VALUE = 800;
  const [debouncedUrlValue] = useDebounce(requestUrl, DEBOUNCE_TIME_VALUE);

  const handleCopyIconClick = (value: string | undefined) => {
    vscode.postMessage({ command: COMMON.ALERT_COPY });

    if (value) {
      navigator.clipboard.writeText(value);
    }
  };

  const memoizedRequestObject = useMemo(
    () =>
      generateSdkRequestObject(
        debouncedUrlValue,
        requestMethod,
        tableData,
        authOption,
        authData,
        bodyOption,
        bodyRawData,
        graphqlData,
      ),
    [
      debouncedUrlValue,
      requestMethod,
      tableData,
      authOption,
      authData,
      bodyOption,
      bodyRawData,
      graphqlData,
    ],
  );

  const handleCodeSnippetOption = (event: ChangeEvent<HTMLSelectElement>) => {
    const clickedTarget = event.target;

    const targetOption = OPTION.CODE_SNIPPET_OPTIONS.filter(
      (languageData) => languageData.label === clickedTarget.value,
    );

    handleCodeSnippetOptionChange(
      clickedTarget.value,
      targetOption[0].variants[0],
      targetOption[0].editorLanguage,
    );
  };

  useEffect(() => {
    codegen.convert(
      codeSnippetOption.language.toLowerCase(),
      codeSnippetOption.variant,
      memoizedRequestObject,
      {},
      (error: string, snippet: string) => {
        if (error) {
        } else {
          setCodeSnippetValue(snippet);
        }
      },
    );
  }, [
    debouncedUrlValue,
    requestMethod,
    codeSnippetOption.language,
    codeSnippetOption.variant,
  ]);

  return (
    <>
      <SelectWrapper primary={false} secondary={false} requestMenu={false}>
        <h3>Language:</h3>
        <SelectOptionWrapper
          onChange={handleCodeSnippetOption}
          value={codeSnippetOption.language}
        >
          {OPTION.CODE_SNIPPET_OPTIONS.map(({ label, variants }, index) => (
            <option
              key={"Code Snippet" + index}
              value={label}
              variant-type={variants[0]}
            >
              {label === "csharp" ? "C#" : (label === "NodeJs" ? "Node" : label)}
            </option>
          ))}
        </SelectOptionWrapper>
        <SelectOptionWrapper
          onChange={(event) => handleCodeSnippetVariantChange(event.target.value)}
          value={codeSnippetOption.variant}
        >
          {OPTION.CODE_SNIPPET_OPTIONS.map(
            ({ label, variants }, index) =>
              label === codeSnippetOption.language &&
              variants.map((variant) => (
                <option key={variant + index} value={variant}>
                  {variant}
                </option>
              )),
          )}
        </SelectOptionWrapper>
        <CopyIcon handleClick={handleCopyIconClick} value={codeSnippetValue} />
      </SelectWrapper>
      <CodeSnippetWrapper>
        <CodeEditor
          codeEditorValue={codeSnippetValue}
          editorOption={OPTION.CODE_SNIPPET_EDITOR_OPTIONS}
          language={codeSnippetOption.editorLanguage.toLowerCase()}
          handleEditorChange={() => undefined}
          handleBeautifyButton={() => undefined}
        />
      </CodeSnippetWrapper>
    </>
  );
};

const CodeSnippetWrapper = styled.div`
  display: flex;
  margin-top: 2rem;
  height: 100%;

  > div {
    flex: 1 1 auto;
  }
`;

const SelectOptionWrapper = styled.select`
  width: auto;
  height: 2.3rem;
  margin-left: 1rem;
  padding-left: 0.5rem;
  border: 0.1rem solid rgba(128 128 128 / 0.7);
  border-radius: 0.25rem;
  font-size: 1.1rem;
  background-color: var(--vscode-editor-background);
  color: var(--default-text);
`;

export default RequestCodeSnippet;
