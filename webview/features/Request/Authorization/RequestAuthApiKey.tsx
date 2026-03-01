import React, { ChangeEvent } from "react";
import { styled } from "styled-components";
import { useShallow } from "zustand/shallow";

import Wrapper from "../../../components/Wrapper";
import InputWrapper from "../../../components/InputWrapper";
import useStore from "../../../store/useStore";
import { OPTION, REQUEST } from "../../../constants";

const RequestAuthApiKey = () => {
  const {
    tableData,
    addAuthTableRow,
    removeAuthTableRow,
    handleRequestKey,
    handleRequestValue,
  } = useStore(
    useShallow((state) => ({
      tableData: state.tableData,
      addAuthTableRow: state.addAuthTableRow,
      removeAuthTableRow: state.removeAuthTableRow,
      handleRequestKey: state.handleRequestKey,
      handleRequestValue: state.handleRequestValue,
    }))
  );

  const apiKeyHeader = tableData["Headers"].find((d) => d.authType === REQUEST.API_KEY);
  const apiKeyParam = tableData["Params"].find((d) => d.authType === REQUEST.API_KEY);
  const apiKeyRow = apiKeyHeader || apiKeyParam;

  if (!apiKeyRow) return;

  const addTo = apiKeyHeader ? REQUEST.ADD_TO_HEADERS : REQUEST.ADD_TO_QUERY_PARAMS;
  const apiKeyOptionType = apiKeyHeader ? "Headers" : "Params";

  const handleAddOptionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    removeAuthTableRow(apiKeyOptionType);
    if (typeof apiKeyRow.value === "string") {
      if (event.target.value === REQUEST.ADD_TO_HEADERS) {
        addAuthTableRow(REQUEST.API_KEY, "Headers", { key: apiKeyRow.key, value: apiKeyRow.value });
      } else {
        addAuthTableRow(REQUEST.API_KEY, "Params", { key: apiKeyRow.key, value: apiKeyRow.value });
      }
    }
  };
  
  return (
    <Wrapper>
      <h2>API Key</h2>
      <InputWrapper>
        <label htmlFor="key">Key:</label>
        <input
          type="text"
          name="key"
          placeholder="Key"
          value={apiKeyRow.key}
          onChange={(event) => handleRequestKey(apiKeyOptionType, apiKeyRow.id, event.target.value)}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="value">Value:</label>
        <input
          type="text"
          name="value"
          placeholder="Value"
          value={apiKeyRow.value as string}
          onChange={(event) => handleRequestValue(apiKeyOptionType, apiKeyRow.id, event.target.value)}
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
