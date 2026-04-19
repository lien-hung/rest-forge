import React from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import { OPTION, REQUEST } from "../../../constants/index";
import useStore from "../../../store/useStore";

const RequestMethod = () => {
  const customMethods = useStore((state) => state.customMethods);
  const themeKind = useStore((state) => state.themeKind);
  const { requestMethod, handleRequestMethodChange } = useStore(
    useShallow((state) => ({
      requestMethod: state.requestMethod,
      handleRequestMethodChange: state.handleRequestMethodChange,
    }))
  );

  const requestMethodOptions = [...OPTION.REQUEST_METHOD_OPTIONS, ...customMethods];

  return (
    <MethodSelectOptionWrapper
      name="httpRequestMethods"
      value={requestMethod}
      onChange={(event) => handleRequestMethodChange(event.target.value)}
    >
      <button className={requestMethod.toLowerCase() + (themeKind === 1 ? "-light" : "")}>
        {/* @ts-ignore */}
        <selectedcontent></selectedcontent>
      </button>
      {requestMethodOptions.map((method, index) => (
        <option
          key={REQUEST.METHOD + index}
          value={method}
          className={method.toLowerCase() + (themeKind === 1 ? "-light" : "")}
        >
          {method}
        </option>
      ))}
    </MethodSelectOptionWrapper>
  );
};

const MethodSelectOptionWrapper = styled.select`
  width: 7rem;
  height: 3rem;
  padding: 0.7rem;
  font-size: 1.15rem;
  border: 1px solid color-mix(in srgb, var(--vscode-focusBorder), transparent 30%);
  border-right: 0;
  border-radius: 0;
  appearance: base-select;

  &::picker(select) {
    appearance: base-select;
    border: none;
  }

  option {
    color: var(--vscode-foreground);
    background-color: var(--vscode-input-background);
    padding: 0.25rem 0 0.25rem 0.5rem;

    &::checkmark {
      display: none;
    }

    &:hover, &:focus {
      opacity: 0.7;
    }
  }

  .get     { color: #6BDD9A; }
  .post    { color: #FFE47E; }
  .put     { color: #74AEF6; }
  .patch   { color: #C0A8E1; }
  .delete  { color: #F79A8E; }
  .head    { color: #6BDD9A; }
  .options { color: #F15EB0; }

  .get-light     { color: #007F31; }
  .post-light    { color: #AD7A03; }
  .put-light     { color: #0053B8; }
  .patch-light   { color: #623497; }
  .delete-light  { color: #8E1A10; }
  .head-light    { color: #007F31; }
  .options-light { color: #A61468; }
`;

export default RequestMethod;
