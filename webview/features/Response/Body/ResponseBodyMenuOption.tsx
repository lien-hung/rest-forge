import React from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import SelectWrapper from "../../../components/SelectWrapper";
import { OPTION, RESPONSE } from "../../../constants/index";
import useStore from "../../../store/useStore";

const ResponseBodyViewOption = () => {
  const {
    responseBodyOption,
    responseBodyViewFormat,
    handleResponseBodyViewFormat,
  } = useStore(
    useShallow((state) => ({
      responseBodyOption: state.responseBodyOption,
      responseBodyViewFormat: state.responseBodyViewFormat,
      handleResponseBodyViewFormat: state.handleResponseBodyViewFormat,
    }))
  );

  return (
    <>
      {responseBodyOption === "Pretty" && (
        <SelectWrapper primary requestMenu={false} secondary={false}>
          <SelectOptionWrapper
            onChange={(event) => handleResponseBodyViewFormat(event.target.value)}
            value={responseBodyViewFormat}
          >
            {OPTION.RESPONSE_BODY_VIEW_FORMAT_OPTIONS.map((option, index) => (
              <option key={RESPONSE.VIEW_FORMAT + index} value={option}>
                {option}
              </option>
            ))}
          </SelectOptionWrapper>
        </SelectWrapper>
      )}
    </>
  );
};

const SelectOptionWrapper = styled.select`
  width: auto;
  height: 2.3rem;
  margin-left: 1rem;
  padding-left: 0.5rem;
  border: 0.1rem solid rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
  font-size: 1.1rem;
  background-color: var(--vscode-editor-background);
  color: var(--default-text);
`;

export default ResponseBodyViewOption;
