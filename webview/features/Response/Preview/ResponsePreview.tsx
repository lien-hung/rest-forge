import React from "react";
import styled from "styled-components";

interface IResponsePreviewProps {
  sourceCode: string;
}

function ResponsePreview({ sourceCode }: IResponsePreviewProps) {
  return (
    <IframeWrapper>
      <iframe srcDoc={sourceCode} title="Response Preview"></iframe>
    </IframeWrapper>
  );
}

const IframeWrapper = styled.div`
  width: 100%;
  height: 100%;

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    background: white;
    overflow: auto;
  }
`;

export default ResponsePreview;