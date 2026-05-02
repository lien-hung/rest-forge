import React, { useEffect } from "react";
import { styled } from "styled-components";
import { useShallow } from "zustand/shallow";

import HighlightInput from "../../../components/HighlightInput";
import InputWrapper from "../../../components/InputWrapper";
import Wrapper from "../../../components/Wrapper";
import { OPTION, REQUEST } from "../../../constants";
import useStore from "../../../store/useStore";

const RequestAuthApiKey = () => {
  const {
    apiKeyData,
    setApiKeyData,
    addAuthTableRow,
    removeAuthTableRow,
  } = useStore(
    useShallow((state) => ({
      apiKeyData: state.apiKeyData,
      setApiKeyData: state.setApiKeyData,
      addAuthTableRow: state.addAuthTableRow,
      removeAuthTableRow: state.removeAuthTableRow,
    }))
  );

  const setApiKeyTableRow = () => {
    removeAuthTableRow("headers");
    removeAuthTableRow("params");

    if (apiKeyData.addTo === REQUEST.ADD_TO_HEADERS) {
      addAuthTableRow(REQUEST.API_KEY, "headers", { key: apiKeyData.key, value: apiKeyData.value });
    } else {
      addAuthTableRow(REQUEST.API_KEY, "params", { key: apiKeyData.key, value: apiKeyData.value });
    }
  };
  
  useEffect(() => setApiKeyTableRow(), [apiKeyData]);

  return (
    <Wrapper>
      <h2>API Key</h2>
      <InputWrapper>
        <label htmlFor="key">Key:</label>
        <HighlightInput
          type="text"
          name="key"
          placeholder="Key"
          value={apiKeyData.key}
          onChange={(event) => setApiKeyData({ ...apiKeyData, key: event.target.value })}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="value">Value:</label>
        <HighlightInput
          type="text"
          name="value"
          placeholder="Value"
          value={apiKeyData.value}
          onChange={(event) => setApiKeyData({ ...apiKeyData, value: event.target.value })}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="addTo">Add to:</label>
        <OptionWrapper
          value={apiKeyData.addTo}
          onChange={(event) => setApiKeyData({ ...apiKeyData, addTo: event.target.value })}
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
  border: 0.1rem solid rgba(128 128 128 / 0.7);
  border-radius: 0.3rem;
  padding: 0.1rem 0.3rem;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-foreground);
`;

export default RequestAuthApiKey;
