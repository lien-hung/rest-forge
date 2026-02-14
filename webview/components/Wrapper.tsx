import React from "react";
import styled from "styled-components";
import { ICommonChildProps } from "./type";

const Wrapper = ({ children }: ICommonChildProps) => {
  return <ComponentWrapper>{children}</ComponentWrapper>;
};

const ComponentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2rem 1.3rem 0 1.3rem;
  overflow-y: auto;
  scrollbar-width: none;

  h2, h3 {
    margin-bottom: 1.3rem;
  }
`;

export default Wrapper;
