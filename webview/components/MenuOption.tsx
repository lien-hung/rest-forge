import React from "react";
import styled from "styled-components";
import { IMenuOptionProps } from "./type";

const MenuOption = ({
  children,
  currentOption,
  menuOption,
  isSeparate,
  isLast,
}: IMenuOptionProps) => {
  return (
    <MenuOptionWrapper
      primary={currentOption === menuOption}
      isSeparate={isSeparate}
      isLast={isLast}
    >
      {children}
    </MenuOptionWrapper>
  );
};

const MenuOptionWrapper = styled.div<{ primary: boolean, isSeparate?: boolean, isLast?: boolean }>`
  display: flex;
  align-items: center;
  margin-left: ${(props) => (props.isSeparate && "auto")};
  margin-right: ${(props) => (props.isLast ? "0" : "2rem")};
  padding: 0 0.2rem 0.4rem 0.2rem;
  border-bottom: ${(props) =>
    props.primary ? "0.2rem solid var(--vscode-button-background)" : "0.2rem solid transparent"};
  color: ${(props) =>
    props.primary ? "var(--vscode-tab-activeForeground)" : "var(--vscode-tab-inactiveForeground)"};

  h3 {
    font-size: 1.15rem;
    font-weight: 400;
    cursor: pointer;
  }
`;

export default MenuOption;
