import React from "react";
import styled from "styled-components";
import { ISaveIconProps } from "./type";
import saveIcon from "../assets/svg/save-icon.svg";

const SaveIcon = ({ handleClick, value }: ISaveIconProps) => {
  return (
    <SaveIconWrapper>
      <img src={saveIcon} className="saveIcon" onClick={() => handleClick(value)} />
    </SaveIconWrapper>
  )
};

const SaveIconWrapper = styled.div`
  margin-left: 1rem;

  .saveIcon {
    opacity: 0.7;
    width: 16px;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }
`;

export default SaveIcon;