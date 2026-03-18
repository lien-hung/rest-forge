import React, { ChangeEvent } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import SelectWrapper from "../../../components/SelectWrapper";
import { COMMON, OPTION, REQUEST } from "../../../constants/index";
import useStore from "../../../store/useStore";
import RequestBodyRawOptions from "./RequestBodyRawOptions";
import RequestBodyMenuOption from "./RequestBodySelectMenuOption";

const RequestBodySelectMenu = () => {
  const {
    bodyOption,
    bodyRawOption,
    handleRequestBodyOption,
    addRequestBodyHeaders,
    removeRequestBodyHeaders,
  } = useStore(
    useShallow((state) => ({
      bodyOption: state.bodyOption,
      bodyRawOption: state.bodyRawOption,
      handleRequestBodyOption: state.handleRequestBodyOption,
      addRequestBodyHeaders: state.addRequestBodyHeaders,
      removeRequestBodyHeaders: state.removeRequestBodyHeaders,
    }))
  );

  const rawOptionHeaderField = OPTION.REQUEST_BODY_RAW_OPTIONS.filter(
    (rawOption) => rawOption.option === bodyRawOption,
  );

  const handleBodyOptionChoice = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedOptionIndex = event.target.selectedIndex;
    const selectedOptionElement = event.target.childNodes[selectedOptionIndex] as HTMLSelectElement;
    
    handleRequestBodyOption(event.target.value);
    removeRequestBodyHeaders();

    if (event.target.value !== REQUEST.NONE) {
      addRequestBodyHeaders(selectedOptionElement.getAttribute("header-type") || "");
    }
  };

  return (
    <>
      <SelectWrapper primary={false} secondary={false} requestMenu>
        <h3>Type:</h3>
        <OptionWrapper
          onChange={handleBodyOptionChoice}
          value={bodyOption}
        >
          {OPTION.REQUEST_BODY_OPTIONS.map(({ option, headerField }, index) => (
            <option
              key={COMMON.BODY + index}
              value={option}
              header-type={
                option === REQUEST.RAW
                  ? rawOptionHeaderField[0].headerField
                  : headerField
              }
            >
              {option}
            </option>
          ))}
        </OptionWrapper>
        {bodyOption === REQUEST.RAW && <RequestBodyRawOptions />}
      </SelectWrapper>
      <RequestBodyMenuOption />
    </>
  );
};

const OptionWrapper = styled.select`
  width: auto;
  height: 2.3rem;
  margin-left: 1rem;
  padding-left: 0.5rem;
  border: 0.1rem solid rgba(128 128 128 / 0.7);
  border-radius: 0.25rem;
  font-size: 1.1rem;
  background-color: var(--vscode-editor-background);
  color: var(--default-text);
`;

export default RequestBodySelectMenu;
