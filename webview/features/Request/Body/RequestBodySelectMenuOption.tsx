import React from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import { OPTION, REQUEST } from "../../../constants/index";
import CodeEditor from "../../../shared/CodeEditor";
import KeyValueTable from "../../../shared/KeyValueTable";
import { OptionType } from "../../../store/slices/type";
import useStore from "../../../store/useStore";
import RequestNoBody from "./RequestNoBody";

const RequestBodySelectMenuOption = () => {
  const {
    bodyOption,
    bodyRawData,
    bodyRawOption,
    handleBodyRawOptionData,
    handleBeautifyButton,
  } = useStore(
    useShallow((state) => ({
      bodyOption: state.bodyOption as OptionType,
      bodyRawData: state.bodyRawData,
      bodyRawOption: state.bodyRawOption,
      handleBodyRawOptionData: state.handleBodyRawOptionData,
      handleBeautifyButton: state.handleBeautifyButton,
    }))
  );

  const keyValueProps = useStore(
    useShallow((state) => ({
      tableData: state.tableData[bodyOption],
      addNewTableRow: state.addNewTableRow,
      deleteTableRow: state.deleteTableRow,
      handleRequestKey: state.handleRequestKey,
      handleRequestValue: state.handleRequestValue,
      handleRequestCheckbox: state.handleRequestCheckbox,
      handleFormValueType: state.handleFormValueType,
      handleFormFileName: state.handleFormFileName,
      handleFormContentType: state.handleFormContentType,
    }))
  );

  const codeEditorProps = useStore(
    useShallow((state) => ({
      shouldBeautifyEditor: state.shouldBeautifyEditor,
      handleBeautifyButton: state.handleBeautifyButton,
    }))
  );

  function handleRequestBodyEditorChange(bodyValue: string | undefined) {
    if (bodyValue) {
      handleBodyRawOptionData(bodyRawOption, bodyValue);
    }
  }

  switch (bodyOption) {
    case REQUEST.FORM_DATA:
    case REQUEST.FORM_URLENCODED:
      return (
        <KeyValueTable
          tableReadOnly={false}
          type={bodyOption}
          title={bodyOption}
          {...keyValueProps}
        />
      );
    case REQUEST.RAW:
      return (
        <RequestRawWrapper>
          <RequestRawTitle>
            <h2>{bodyRawOption} Content</h2>
            <a onClick={handleBeautifyButton}>Beautify</a>
          </RequestRawTitle>
          <CodeEditor
            language={bodyRawOption.toLowerCase()}
            editorOption={OPTION.EDITOR_OPTIONS}
            codeEditorValue={
              bodyRawData[
              bodyRawOption.toLowerCase() as keyof {
                text: string;
                javascript: string;
                json: string;
                html: string;
                xml: string;
              }
              ]
            }
            handleEditorChange={handleRequestBodyEditorChange}
            requestForm
            {...codeEditorProps}
          />
        </RequestRawWrapper>
      );
    default:
      return <RequestNoBody />;
  }
};

const RequestRawTitle = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 1.3rem;

  a {
    margin-left: auto;
    cursor: pointer;
  }
`;

const RequestRawWrapper = styled.div`
  display: flex;
  flex-flow: column;
  margin: 1.3rem;
  height: 100%;

  > div {
    &:nth-child(2) {
      border: 0.1rem solid rgba(128, 128, 128, 0.7);
      border-radius: 0.25rem;
      flex: 1 1 auto;
    }
  }
`;

export default RequestBodySelectMenuOption;
