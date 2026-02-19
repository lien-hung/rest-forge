// @ts-ignore
import codegen from "postman-code-generators";
import React, { useEffect, useMemo, ChangeEvent } from "react";
import styled from "styled-components";
import { useDebounce } from "use-debounce";
import { useShallow } from "zustand/shallow";

import CopyIcon from "../../../components/CopyIcon";
import SelectWrapper from "../../../components/SelectWrapper";
import { COMMON, OPTION } from "../../../constants/index";
import CodeEditor from "../../../shared/CodeEditor";
import useStore from "../../../store/useStore";
import { generateSdkRequestObject } from "../../../utils/index";
import { OptionType } from "../../../store/slices/type";

const RequestCodeSnippet = () => {
  const {
    authData,
    authOption,
    requestMethod,
    requestUrl,
    bodyOption,
    bodyRawData,
    bodyRawOption,
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
      bodyOption: state.bodyOption as OptionType,
      bodyRawData: state.bodyRawData,
      bodyRawOption: state.bodyRawOption,
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
        bodyRawOption,
        bodyRawData,
      ),
    [
      debouncedUrlValue,
      requestMethod,
      tableData,
      authOption,
      authData,
      bodyOption,
      bodyRawOption,
      bodyRawData,
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
        <h3>Language: </h3>
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
              {label === "csharp" ? "C#" : (label === "NodeJs" ? "Node.js" : label)}
            </option>
          ))}
        </SelectOptionWrapper>
        <h3 className="variantsLabel">Variants: </h3>
        <SelectOptionWrapper
          onChange={(event) =>
            handleCodeSnippetVariantChange(event.target.value)
          }
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
      <CodeEditor
        codeEditorValue={codeSnippetValue}
        editorOption={OPTION.CODE_SNIPPET_EDITOR_OPTIONS}
        language={codeSnippetOption.editorLanguage.toLowerCase()}
        handleEditorChange={() => undefined}
        handleBeautifyButton={() => undefined}
      />
    </>
  );
};

const SelectOptionWrapper = styled.select`
  width: 9rem;
  height: 2.3rem;
  margin-left: 1rem;
  padding-left: 0.7rem;
  border: 0.1rem solid var(--vscode-foreground);
  border-radius: 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-foreground);
`;

export default RequestCodeSnippet;
