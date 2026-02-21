import React from "react";
import styled from "styled-components";

import { OPTION, RESPONSE } from "../../../constants/index";

interface IResponseMetaDataProps {
  responseSize?: number;
  requestTime?: number;
  statusCode?: number;
  statusText?: string;
}

const ResponseMetaData = ({
  responseSize = 0,
  requestTime = 0,
  statusCode = 0,
  statusText = "",
}: IResponseMetaDataProps) => {
  const time = requestTime >= 1000 ? `${(requestTime / 1000).toFixed(2)} s` : `${requestTime} ms`;
  const statusCodeAndText = `${statusCode} ${statusText}`;
  const size = responseSize >= 1000 ? `${(responseSize / 1000).toFixed(2)} KB` : `${responseSize} B`;

  return (
    <ResponseMetaDataContainer>
      {OPTION.RESPONSE_RESULT_INFORMATION.map((option, index) => (
        <MetaDataContainer
          secondary={index === 0 && (statusCode < 200 || statusCode > 299)}
          key={RESPONSE.METADATA + index}
        >
          <span>{option}:</span>
          <span className="metaDataColor">
            {index === 0 ? statusCodeAndText : index === 2 ? size : time}
          </span>
        </MetaDataContainer>
      ))}
    </ResponseMetaDataContainer>
  );
};

const ResponseMetaDataContainer = styled.div`
  display: flex;
  margin: 0.35rem 0 1.5rem 0;
`;

const MetaDataContainer = styled.div<{ secondary: boolean }>`
  display: flex;
  align-items: center;
  margin: 1.6rem 0 0 1.3rem;
  padding-bottom: 0.5rem;

  span {
    margin-left: 0.2rem;
    font-size: 1.2rem;
    font-weight: 400;
  }

  .metaDataColor {
    color: ${(props) =>
      props.secondary ? "rgb(255 100 100)" : "rgb(66 245 66)"};
    font-weight: 300;
  }
`;

export default ResponseMetaData;
