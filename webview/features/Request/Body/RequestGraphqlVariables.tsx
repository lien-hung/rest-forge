import React from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import useStore from "../../../store/useStore";
import CodeEditor from "../../../shared/CodeEditor";
import { OPTION } from "../../../constants";

const RequestGraphqlVariables = () => {
  const {
    graphqlVariables,
    handleGraphqlVariables,
    shouldBeautifyEditor,
    handleBeautifyButton,
  } = useStore(
    useShallow((state) => ({
      graphqlVariables: state.graphqlData.variables,
      handleGraphqlVariables: state.handleGraphqlVariables,
      shouldBeautifyEditor: state.shouldBeautifyEditor,
      handleBeautifyButton: state.handleBeautifyButton,
    }))
  );

  function handleVariablesChange(value: string | undefined) {
    if (value) {
      handleGraphqlVariables(value);
    }
  }

  return (
    <RequestVariablesWrapper>
      <RequestVariablesTitle>
        <h2>Variables</h2>
        <a onClick={handleBeautifyButton}>Beautify</a>
      </RequestVariablesTitle>
      <CodeEditor
        language="json"
        editorOption={OPTION.EDITOR_OPTIONS}
        codeEditorValue={graphqlVariables}
        handleEditorChange={handleVariablesChange}
        requestForm
        shouldBeautifyEditor={shouldBeautifyEditor}
        handleBeautifyButton={handleBeautifyButton}
      />
    </RequestVariablesWrapper>
  );
};

const RequestVariablesTitle = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 1rem;

  a {
    margin-left: auto;
    cursor: pointer;
  }
`;

const RequestVariablesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;

  > div {
    &:nth-child(2) {
      border: 0.1rem solid rgba(128 128 128 / 0.7);
      border-radius: 0.25rem;
      flex: 1 1 auto;
    }
  }
`;

export default RequestGraphqlVariables;