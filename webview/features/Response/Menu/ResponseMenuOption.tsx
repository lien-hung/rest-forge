import React from "react";
import { useShallow } from "zustand/shallow";

import { COMMON, OPTION, REQUEST } from "../../../constants/index";
import CodeEditor from "../../../shared/CodeEditor";
import KeyValueTable from "../../../shared/KeyValueTable";
import useStore from "../../../store/useStore";
import RequestBodyMenu from "../Body/ResponseBodyMenu";

const ResponseMenuOption = () => {
  const {
    responseData,
    responseOption,
    responseHeaders,
    responseBodyOption,
    responseBodyViewFormat,
  } = useStore(
    useShallow((state) => ({
      responseData: state.responseData?.data,
      responseOption: state.responseOption,
      responseHeaders: state.responseData?.headers,
      responseBodyOption: state.responseBodyOption,
      responseBodyViewFormat: state.responseBodyViewFormat,
    }))
  );

  switch (responseOption) {
    case COMMON.HEADERS:
      return responseHeaders && (
        <KeyValueTable
          title="Response Headers"
          tableData={responseHeaders}
          tableReadOnly
        />
      );
    default:
      return (
        <>
          <RequestBodyMenu />
          <CodeEditor
            codeEditorValue={responseData ? responseData : ""}
            language={
              responseBodyOption === REQUEST.RAW
                ? REQUEST.RAW
                : responseBodyViewFormat.toLowerCase()
            }
            viewOption={responseBodyOption}
            editorOption={OPTION.EDITOR_OPTIONS}
            previewMode
          />
        </>
      );
  }
};

export default ResponseMenuOption;
