import React from "react";
import styled from "styled-components";
import { ICommonChildProps } from "./type";

const DetailOption = ({ children }: ICommonChildProps) => {
  return (
    <DetailOptionWrapper>{children}</DetailOptionWrapper>
  );
};

const DetailOptionWrapper = styled.div`
  display: flex;
  flex-flow: row;
  gap: 2rem;
  padding: 0 1.3rem;
  flex: 0 1 auto;
  border-bottom: 1px solid rgba(128 128 128 / 0.7);
`;

export default DetailOption;
