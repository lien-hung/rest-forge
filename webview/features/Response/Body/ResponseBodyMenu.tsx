import FileSaver from "file-saver";
import React, { MouseEvent } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import CopyIcon from "../../../components/CopyIcon";
import SaveIcon from "../../../components/SaveIcon";
import SelectWrapper from "../../../components/SelectWrapper";
import { COMMON, OPTION, RESPONSE } from "../../../constants/index";
import useStore from "../../../store/useStore";
import ResponseBodyViewOption from "./ResponseBodyMenuOption";

const RequestBodyMenu = () => {
  const { responseData, responseBodyOption, handleResponseBodyOption } =
    useStore(
      useShallow((state) => ({
        responseData: state.responseData,
        responseBodyOption: state.responseBodyOption,
        handleResponseBodyOption: state.handleResponseBodyOption,
      }))
    );

  const handleOptionChange = (event: MouseEvent) => {
    const clickedTarget = event.target as HTMLDivElement;

    handleResponseBodyOption(clickedTarget.innerText);
  };

  const handleCopyIconClick = (value: string | undefined) => {
    vscode.postMessage({ command: COMMON.ALERT_COPY });

    if (value) {
      navigator.clipboard.writeText(value);
    }
  };

  const handleSaveIconClick = (value: string | undefined) => {
    if (value) {
      if (value.startsWith("blob:vscode-webview://")) {
        FileSaver.saveAs(value, "response");
      } else {
        const textBlob = new Blob([value], { type: "text/plain;charset=utf-8" });
        FileSaver.saveAs(textBlob, "response.txt");
      }
    }
  };

  return (
    <SelectWrapper primary={false} secondary={false} requestMenu={false}>
      {OPTION.RESPONSE_BODY_OPTIONS.map((option, index) => (
        <OptionContainer
          key={RESPONSE.RESPONSE_BODY + index}
          primary={responseBodyOption === option}
          radius={index}
          onClick={handleOptionChange}
        >
          {option}
        </OptionContainer>
      ))}
      <ResponseBodyViewOption />
      <SideIconsWrapper>
        {responseBodyOption !== COMMON.PREVIEW && (
          <CopyIcon
            handleClick={handleCopyIconClick}
            value={(typeof responseData?.body) === "string" ? responseData?.body : ""}
          />
        )}
        <SaveIcon
          handleClick={handleSaveIconClick}
          value={responseData?.blobUri || responseData?.body}
        />
      </SideIconsWrapper>
    </SelectWrapper>
  );
};

const OptionContainer = styled.div<{ primary: boolean; radius: number }>`
  padding: 0.6rem 0.9rem;
  background: ${(props) =>
    props.primary
      ? "var(--vscode-button-hoverBackground)"
      : "rgba(97, 97, 97, 0.15)"};
  border-radius: ${(props) =>
    props.radius === 0
      ? "0.5rem 0 0 0.5rem"
      : props.radius === 2
        ? "0 0.5rem 0.5rem 0"
        : "0"};
  font-weight: ${(props) => (props.primary ? "400" : "300")};
  color: var(--default-text);
  cursor: pointer;
`;

const SideIconsWrapper = styled.div`
  display: flex;
  margin-left: auto;
`;

export default RequestBodyMenu;
