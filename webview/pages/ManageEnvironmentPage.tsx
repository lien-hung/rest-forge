import React, { useEffect, useState } from "react";
import styled from "styled-components";
import useStore from "../store/useStore";
import { COMMON } from "../constants";
import EnvironmentDetails from "../features/Environments/EnvironmentDetails";

const ManageEnvironmentPage = () => {
  const envNameElement = document.getElementById("env-name");
  const [envName, setEnvName] = useState(envNameElement?.innerText || "");
  const setVariables = useStore((state) => state.setVariables);

  const handleExtensionMessage = (event: MessageEvent) => {
    if (event.data.type === COMMON.HAS_VARIABLES) {
      const variables = event.data.variables;
      if (Array.isArray(variables) && variables.length > 0) {
        setVariables(variables);
        setEnvName(event.data.envName);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleExtensionMessage);
    vscode.postMessage({ command: COMMON.INIT_VARIABLES, envName });
  }, []);

  return (
    <ManageEnvironmentWrapper>
      <EnvironmentDetails envName={envName} />
    </ManageEnvironmentWrapper>
  );
}

const ManageEnvironmentWrapper = styled.div`
  display: flex;
  color: var(--vscode-foreground);
`;

export default ManageEnvironmentPage;