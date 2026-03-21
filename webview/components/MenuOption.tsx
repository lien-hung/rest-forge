import React from "react";
import styled from "styled-components";
import { IMenuOptionProps } from "./type";

const MenuOption = ({
  children,
  currentOption,
  menuOption,
  isSeparate,
}: IMenuOptionProps) => {
  return (
    <MenuOptionWrapper
      primary={currentOption === menuOption}
      isSeparate={isSeparate}
    >
      {children}
    </MenuOptionWrapper>
  );
};

const MenuOptionWrapper = styled.div<{ primary: boolean, isSeparate?: boolean, isLast?: boolean }>`
  display: flex;
  gap: 0.4rem;
  margin-left: ${(props) => (props.isSeparate && "auto")};
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

  p {
    color: rgb(66 245 66);
    user-select: none;
  }

  p.light {
    color: rgb(47 177 47);
  }
`;

export default MenuOption;
