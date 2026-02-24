import React from "react";
import styled from "styled-components";
import { ICopyIconProps } from "./type";
import copyIcon from "../assets/svg/copy-icon.svg";

const CopyIcon = ({ handleClick, value }: ICopyIconProps) => {
  return (
    <CopyIconWrapper>
      <img src={copyIcon} className="copyIcon" onClick={() => handleClick(value)} />
    </CopyIconWrapper>
  );
};

const CopyIconWrapper = styled.div`
  .copyIcon {
    opacity: 0.7;
    width: 18px;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }
`;

export default CopyIcon;
