import React from "react";
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
  } = useStore(
    useShallow((state) => ({
      bodyOption: state.bodyOption as OptionType,
      bodyRawData: state.bodyRawData,
      bodyRawOption: state.bodyRawOption.toLowerCase(),
      handleBodyRawOptionData: state.handleBodyRawOptionData,
    }))
  );

  const keyValueProps = useStore(
    useShallow((state) => ({
      tableData: state.tableData[bodyOption],
      addNewTableRow: state.addNewTableRow,
      deleteTableRow: state.deleteTableRow,
      handleRequestKey: state.handleRequestKey,
      handleRequestValue: state.handleRequestValue,
      addRequestBodyHeaders: state.addRequestBodyHeaders,
      handleRequestCheckbox: state.handleRequestCheckbox,
      removeRequestBodyHeaders: state.removeRequestBodyHeaders,
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
        <>
          <div style={{ height: "2rem" }}></div>
          <CodeEditor
            language={bodyRawOption}
            editorOption={OPTION.EDITOR_OPTIONS}
            codeEditorValue={
              bodyRawData[
              bodyRawOption as keyof {
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
        </>
      );
    default:
      return <RequestNoBody />;
  }
};

export default RequestBodySelectMenuOption;
