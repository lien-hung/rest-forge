import React, { ChangeEvent } from "react";
import { styled } from "styled-components";
import { useShallow } from "zustand/shallow";

import Wrapper from "../../../components/Wrapper";
import InputWrapper from "../../../components/InputWrapper";
import useStore from "../../../store/useStore";
import { COMMON, OPTION, REQUEST } from "../../../constants";

const RequestAuthApiKey = () => {
  const {
    keyValueTableData,
    addAuthTableRow,
    removeAuthTableRow,
    handleRequestKey,
    handleRequestValue,
  } = useStore(
    useShallow((state) => ({
      keyValueTableData: state.keyValueTableData,
      addAuthTableRow: state.addAuthTableRow,
      removeAuthTableRow: state.removeAuthTableRow,
      handleRequestKey: state.handleRequestKey,
      handleRequestValue: state.handleRequestValue,
    }))
  );

  const apiKeyRow = keyValueTableData.find((d) => d.authType === REQUEST.API_KEY);
  if (!apiKeyRow) return;

  const addTo = apiKeyRow.optionType === COMMON.HEADERS
    ? REQUEST.ADD_TO_HEADERS
    : REQUEST.ADD_TO_QUERY_PARAMS;

  const handleAddOptionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    removeAuthTableRow();
    if (event.target.value === REQUEST.ADD_TO_HEADERS) {
      addAuthTableRow(REQUEST.API_KEY, COMMON.HEADERS, apiKeyRow.key, apiKeyRow.value);
    } else {
      addAuthTableRow(REQUEST.API_KEY, REQUEST.PARAMS, apiKeyRow.key, apiKeyRow.value);
    }
  };
  
  return (
    <Wrapper>
      <InputWrapper>
        <label htmlFor="key">Key:</label>
        <input
          type="text"
          name="key"
          placeholder="Key"
          value={apiKeyRow.key}
          onChange={(event) => handleRequestKey(apiKeyRow.id, event.target.value)}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="value">Value:</label>
        <input
          type="text"
          name="value"
          placeholder="Value"
          value={apiKeyRow.value}
          onChange={(event) => handleRequestValue(apiKeyRow.id, event.target.value)}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="addTo">Add to:</label>
        <OptionWrapper
          value={addTo}
          onChange={handleAddOptionChange}
        >
          {OPTION.ADD_TO_OPTIONS.map((option, index) => (
            <option key={REQUEST.ADD_TO_OPTION + index} value={option}>
              {option}
            </option>
          ))}
        </OptionWrapper>
      </InputWrapper>
    </Wrapper>
  );
};

const OptionWrapper = styled.select`
  width: auto;
  height: 2.5rem;
  border: 0.1rem solid rgba(128, 128, 128, 0.7);
  border-radius: 0.3rem;
  padding: 0.1rem 0.3rem;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-foreground);
`;

export default RequestAuthApiKey;
