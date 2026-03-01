import React, { ChangeEvent } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import SelectWrapper from "../../../components/SelectWrapper";
import { OPTION, REQUEST } from "../../../constants/index";
import useStore from "../../../store/useStore";
import RequestAuthMenuOption from "./RequestAuthSelectMenuOption";

const RequestAuthSelectMenu = () => {
  const {
    authOption,
    handleRequestAuthType,
    addAuthTableRow,
    removeAuthTableRow,
  } = useStore(
    useShallow((state) => ({
      authOption: state.authOption,
      handleRequestAuthType: state.handleRequestAuthType,
      addAuthTableRow: state.addAuthTableRow,
      removeAuthTableRow: state.removeAuthTableRow,
    }))
  );

  const handleAuthOptionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    handleRequestAuthType(event.target.value);

    removeAuthTableRow("Headers");
    removeAuthTableRow("Params");

    if (event.target.value === REQUEST.API_KEY) {
      addAuthTableRow(REQUEST.API_KEY, "Headers");
    }
  };

  return (
    <>
      <SelectWrapper requestMenu primary={false} secondary={false}>
        <h3>Type:</h3>
        <OptionWrapper
          onChange={handleAuthOptionChange}
          value={authOption}
        >
          {OPTION.AUTHORIZATION_OPTIONS.map((option, index) => (
            <option key={REQUEST.AUTH + index} value={option}>
              {option}
            </option>
          ))}
        </OptionWrapper>
      </SelectWrapper>
      <RequestAuthMenuOption />
    </>
  );
};

const OptionWrapper = styled.select`
  width: auto;
  height: 2.3rem;
  margin-left: 1rem;
  padding-left: 0.5rem;
  border: 0.1rem solid rgba(128, 128, 128, 0.7);
  border-radius: 0.25rem;
  font-size: 1.1rem;
  background-color: var(--vscode-editor-background);
  color: var(--default-text);
`;

export default RequestAuthSelectMenu;
