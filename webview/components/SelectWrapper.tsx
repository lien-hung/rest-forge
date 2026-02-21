import React from "react";
import styled from "styled-components";
import { ISelectWrapperProps, ISelectWrapperStyledProps } from "./type";

const SelectWrapper = ({
  children,
  requestMenu,
  primary,
  secondary,
}: ISelectWrapperProps) => {
  return (
    <SelectWrapperContainer
      primary={primary}
      secondary={secondary}
      border={requestMenu}
    >
      {children}
    </SelectWrapperContainer>
  );
};

const SelectWrapperContainer = styled.div<ISelectWrapperStyledProps>`
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: ${(props) => props.secondary && "space-around"};
  width: ${(props) => props.secondary && "100%"};
  margin: ${(props) => props.primary ? "0 0 0 1rem" : "1.3rem 1.3rem 0 1.3rem"};

  h3 {
    font-size: 1.2rem;
  }

  .variantsLabel {
    margin-left: 1.5rem;
  }
`;

export default SelectWrapper;
