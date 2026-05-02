import React from "react";
import { useShallow } from "zustand/shallow";

import HighlightInput from "../../../components/HighlightInput";
import InputWrapper from "../../../components/InputWrapper";
import Wrapper from "../../../components/Wrapper";
import { REQUEST } from "../../../constants/index";
import useStore from "../../../store/useStore";

const RequestAuthBearerToken = () => {
  const {
    authDataToken,
    authDataTokenPrefix,
    handleRequestAuthData,
  } = useStore(
    useShallow((state) => ({
      authDataToken: state.authData.token,
      authDataTokenPrefix: state.authData.tokenPrefix,
      handleRequestAuthData: state.handleRequestAuthData,
    }))
  );

  return (
    <Wrapper>
      <h2>Bearer Token</h2>
      <InputWrapper>
        <label htmlFor="token">Token:</label>
        <HighlightInput
          name="token"
          placeholder="Token"
          value={authDataToken}
          onChange={(event) => handleRequestAuthData(REQUEST.TOKEN, event.target.value)}
        />
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="prefix">Prefix:</label>
        <input
          name="prefix"
          placeholder="e.g. Bearer"
          value={authDataTokenPrefix}
          onChange={(event) => handleRequestAuthData(REQUEST.TOKEN_PREFIX, event.target.value)}
        />
      </InputWrapper>
    </Wrapper>
  );
};

export default RequestAuthBearerToken;
