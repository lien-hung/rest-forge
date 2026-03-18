import React from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import useStore from "../../../store/useStore";
import CodeEditor from "../../../shared/CodeEditor";
import { OPTION } from "../../../constants";

const RequestGraphqlQuery = () => {
  const {
    graphqlQuery,
    handleGraphqlQuery,
    shouldBeautifyEditor,
    handleBeautifyButton,
  } = useStore(
    useShallow((state) => ({
      graphqlQuery: state.graphqlData.query,
      handleGraphqlQuery: state.handleGraphqlQuery,
      shouldBeautifyEditor: state.shouldBeautifyEditor,
      handleBeautifyButton: state.handleBeautifyButton,
    }))
  );

  function handleQueryChange(value: string | undefined) {
    if (value) {
      handleGraphqlQuery(value);
    }
  }

  return (
    <RequestQueryWrapper>
      <RequestQueryTitle>
        <h2>Query</h2>
        <a onClick={handleBeautifyButton}>Beautify</a>
      </RequestQueryTitle>
      <CodeEditor
        language="graphql"
        editorOption={OPTION.EDITOR_OPTIONS}
        codeEditorValue={graphqlQuery}
        handleEditorChange={handleQueryChange}
        requestForm
        shouldBeautifyEditor={shouldBeautifyEditor}
        handleBeautifyButton={handleBeautifyButton}
      />
    </RequestQueryWrapper>
  );
};

const RequestQueryTitle = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 1rem;

  a {
    margin-left: auto;
    cursor: pointer;
  }
`;

const RequestQueryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0 0 60%;

  > div {
    &:nth-child(2) {
      border: 0.1rem solid rgba(128 128 128 / 0.7);
      border-radius: 0.25rem;
      flex: 1 1 auto;
    }
  }
`;

export default RequestGraphqlQuery;