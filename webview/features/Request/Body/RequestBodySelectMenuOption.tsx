import React from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import { OPTION, REQUEST } from "../../../constants/index";
import CodeEditor from "../../../shared/CodeEditor";
import KeyValueTable from "../../../shared/KeyValueTable";
import useStore from "../../../store/useStore";
import { camelize } from "../../../utils";
import { BodyOptionType, OptionType } from "../../../utils/type";
import RequestGraphqlQuery from "./RequestGraphqlQuery";
import RequestGraphqlVariables from "./RequestGraphqlVariables";
import RequestNoBody from "./RequestNoBody";

const RequestBodySelectMenuOption = () => {
  const {
    bodyOption,
    bodyRawData,
    bodyRawOption,
    handleBodyRawOptionData,
    shouldBeautifyEditor,
    handleBeautifyButton,
  } = useStore(
    useShallow((state) => ({
      bodyOption: state.bodyOption as BodyOptionType,
      bodyRawData: state.bodyRawData,
      bodyRawOption: state.bodyRawOption,
      handleBodyRawOptionData: state.handleBodyRawOptionData,
      shouldBeautifyEditor: state.shouldBeautifyEditor,
      handleBeautifyButton: state.handleBeautifyButton,
    }))
  );

  const bodyRawOptionLower = bodyRawOption.toLowerCase();
  const bodyOptionCamelCase = camelize(bodyOption) as OptionType;

  const keyValueProps = useStore(
    useShallow((state) => ({
      tableData: state.tableData[bodyOptionCamelCase],
      addNewTableRow: state.addNewTableRow,
      deleteTableRow: state.deleteTableRow,
      handleRequestKey: state.handleRequestKey,
      handleRequestValue: state.handleRequestValue,
      handleRequestCheckbox: state.handleRequestCheckbox,
      handleFormValueType: state.handleFormValueType,
      handleFormFilePath: state.handleFormFilePath,
    }))
  );

  function handleRequestBodyEditorChange(bodyValue: string | undefined) {
    if (bodyValue) {
      handleBodyRawOptionData(bodyValue);
    }
  }

  switch (bodyOption) {
    case REQUEST.FORM_DATA:
    case REQUEST.FORM_URLENCODED:
      return (
        <KeyValueTable
          tableReadOnly={false}
          type={bodyOptionCamelCase}
          title={bodyOption}
          {...keyValueProps}
        />
      );
    case REQUEST.GRAPHQL:
      return (
        <RequestGraphqlWrapper>
          <RequestGraphqlQuery />
          <RequestGraphqlVariables />
        </RequestGraphqlWrapper>
      );
    case REQUEST.RAW:
      return (
        <RequestRawWrapper>
          <RequestRawTitle>
            <h2>{bodyRawOption} Content</h2>
            <a onClick={handleBeautifyButton}>Beautify</a>
          </RequestRawTitle>
          <CodeEditor
            language={bodyRawOptionLower}
            editorOption={OPTION.EDITOR_OPTIONS}
            codeEditorValue={bodyRawData}
            handleEditorChange={handleRequestBodyEditorChange}
            requestForm
            shouldBeautifyEditor={shouldBeautifyEditor}
            handleBeautifyButton={handleBeautifyButton}
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
  margin-bottom: 1rem;

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
      border: 0.1rem solid rgba(128 128 128 / 0.7);
      border-radius: 0.25rem;
      flex: 1 1 auto;
    }
  }
`;

const RequestGraphqlWrapper = styled.div`
  display: flex;
  flex-flow: column;
  height: 100%;
  margin: 1.3rem;
  gap: 1rem;
`;

export default RequestBodySelectMenuOption;
