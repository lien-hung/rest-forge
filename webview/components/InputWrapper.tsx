import React from "react";
import styled from "styled-components";
import { ICommonChildProps } from "./type";

const InputWrapper = ({ children }: ICommonChildProps) => {
  return <InputWrapperContainer>{children}</InputWrapperContainer>;
};

const InputWrapperContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.2rem;
  padding: 0 1rem;

  label {
    margin-right: 1rem;
    opacity: 0.95;
    flex: 0 0 8rem;
  }

  input {
    border: 0.1rem solid rgba(128 128 128 / 0.7);
    border-radius: 0.3rem;
    padding: 0.5rem 0.7rem;
    color: var(--default-text);
    background-color: transparent;
    
    &::placeholder {
      opacity: 0.7;
    }
  }

  input[disabled] {
    opacity: 0.8;
    font-style: italic;
  }
`;

export default InputWrapper;
