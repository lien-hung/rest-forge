import React from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import useStore from "../../store/useStore";
import VariableTable from "./VariableTable";
import Button from "../../components/Button";
import { COMMAND } from "../../../src/constants";

const EnvironmentDetails = ({ envName }: { envName: string }) => {
  const variables = useStore((state) => state.variables);
  const variableTableProps = useStore(
    useShallow((state) => ({
      addVariable: state.addVariable,
      deleteVariable: state.deleteVariable,
      handleVariableCheckbox: state.handleVariableCheckbox,
      handleVariableKey: state.handleVariableKey,
      handleVariableValue: state.handleVariableValue,
      toggleShowVariable: state.toggleShowVariable,
    }))
  );

  const handleSaveVariables = () => {
    vscode.postMessage({
      command: COMMAND.SET_VARIABLES,
      envName,
      envData: variables,
    });
  }

  return (
    <Container>
      <h2>{envName}</h2>
      <VariableTable
        variables={variables}
        {...variableTableProps}
      />
      <Button primary handleButtonClick={handleSaveVariables}>Save</Button>
    </Container>
  );
};

const Container = styled.div`
  padding: 1.5rem;
  width: 100%;

  h2 {
    margin-bottom: 1.3rem;
  }
`;

export default EnvironmentDetails;