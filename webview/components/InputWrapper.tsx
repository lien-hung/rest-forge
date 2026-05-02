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

  p {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 0.1rem solid transparent;
    display: flex;
    align-items: center;
    padding: 0.5rem 0.7rem;
    white-space: nowrap;
    overflow: scroll hidden;
    scrollbar-width: none;
    pointer-events: none;
  }

  input {
    border: 0.1rem solid rgba(128 128 128 / 0.7);
    border-radius: 0.3rem;
    padding: 0.5rem 0.7rem;
    color: transparent;
    background-color: transparent;
    
    &::placeholder {
      opacity: 0.7;
    }
  }

  > input {
    color: var(--default-text);
  }
`;

export default InputWrapper;
