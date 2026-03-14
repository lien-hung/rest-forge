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
  padding: 0 1.3rem;
  flex: 0 1 auto;
  border-bottom: 1px solid rgba(128, 128, 128, 0.7);
  
  p {
    padding-bottom: 0.65rem;
    color: rgb(66 245 66);
    transform: translateX(-1.8rem);
    user-select: none;
  }

  p.light {
    color: rgb(47 177 47);
  }
`;

export default DetailOption;
