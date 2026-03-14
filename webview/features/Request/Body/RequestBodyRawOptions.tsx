import React, { ChangeEvent } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import SelectWrapper from "../../../components/SelectWrapper";
import { OPTION, REQUEST } from "../../../constants/index";
import useStore from "../../../store/useStore";

const RequestBodyRawOptions = () => {
  const {
    bodyRawOption,
    handleBodyRawOption,
    addRequestBodyHeaders,
    removeRequestBodyHeaders,
  } = useStore(
    useShallow((state) => ({
      bodyRawOption: state.bodyRawOption,
      handleBodyRawOption: state.handleBodyRawOption,
      addRequestBodyHeaders: state.addRequestBodyHeaders,
      removeRequestBodyHeaders: state.removeRequestBodyHeaders,
    }))
  );

  const handleBodyRawSelectOption = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedOptionIndex = event.target.selectedIndex;
    const selectedOptionElement = event.target.childNodes[selectedOptionIndex] as HTMLSelectElement;

    handleBodyRawOption(event.target.value);
    removeRequestBodyHeaders();

    if (event.target.value !== REQUEST.NONE) {
      addRequestBodyHeaders(selectedOptionElement.getAttribute("header-type") || "");
    }
  };

  return (
    <SelectWrapper primary secondary={false} requestMenu={false}>
      <SelectOptionWrapper
        onChange={handleBodyRawSelectOption}
        value={bodyRawOption}
      >
        {OPTION.REQUEST_BODY_RAW_OPTIONS.map(
          ({ option, headerField }, index) => (
            <option
              key={REQUEST.RAW + index}
              header-type={headerField}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </SelectOptionWrapper>
    </SelectWrapper>
  );
};

const SelectOptionWrapper = styled.select`
  width: auto;
  height: 2.3rem;
  padding-left: 0.5rem;
  border: 0.1rem solid rgba(128, 128, 128, 0.7);
  border-radius: 0.25rem;
  font-size: 1.1rem;
  background-color: var(--vscode-editor-background);
  color: var(--default-text);
`;

export default RequestBodyRawOptions;
