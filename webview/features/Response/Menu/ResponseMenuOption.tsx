import React from "react";
import { styled } from "styled-components";
import { useShallow } from "zustand/shallow";

import { COMMON, OPTION, REQUEST } from "../../../constants/index";
import CodeEditor from "../../../shared/CodeEditor";
import KeyValueTable from "../../../shared/KeyValueTable";
import useStore from "../../../store/useStore";
import RequestBodyMenu from "../Body/ResponseBodyMenu";

const ResponseMenuOption = () => {
  const {
    responseBody,
    responseBlobUri,
    responseOption,
    responseHeaders,
    responseBodyOption,
    responseBodyViewFormat,
  } = useStore(
    useShallow((state) => ({
      responseBody: state.responseData?.body,
      responseBlobUri: state.responseData?.blobUri,
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
          <ResponseBodyWrapper>
            <CodeEditor
              codeEditorValue={responseBlobUri || (responseBody || "")}
              language={
                responseBodyOption === REQUEST.RAW
                  ? REQUEST.RAW
                  : responseBodyViewFormat.toLowerCase()
              }
              viewOption={responseBodyOption}
              editorOption={OPTION.READ_ONLY_EDITOR_OPTIONS}
              previewMode
            />
          </ResponseBodyWrapper>
        </>
      );
  }
};

const ResponseBodyWrapper = styled.div`
  display: flex;
  margin-top: 2rem;
  height: 100%;

  > div {
    flex: 1 1 auto;
  }
`;

export default ResponseMenuOption;
