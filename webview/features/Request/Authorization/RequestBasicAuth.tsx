import React, { useState } from "react";
import styled from "styled-components";
import { useShallow } from "zustand/shallow";

import passwordHideIcon from "../../../assets/svg/password-hide.svg";
import passwordShowIcon from "../../../assets/svg/password-show.svg";

import InputWrapper from "../../../components/InputWrapper";
import Wrapper from "../../../components/Wrapper";
import { REQUEST } from "../../../constants/index";
import useStore from "../../../store/useStore";

const RequestBasicAuth = () => {
  const {
    authData,
    handleRequestAuthData,
  } = useStore(
    useShallow((state) => ({
      authData: state.authData,
      handleRequestAuthData: state.handleRequestAuthData,
    }))
  );
  const [shouldShowPassword, setShouldShowPassword] = useState(false);

  return (
    <Wrapper>
      <h2>Basic Auth</h2>
      <InputWrapper>
        <label htmlFor="username">Username:</label>
        <PasswordWrapper>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={authData.username}
            onChange={(event) =>
              handleRequestAuthData(REQUEST.USERNAME, event.target.value)
            }
          />
        </PasswordWrapper>
      </InputWrapper>
      <InputWrapper>
        <label htmlFor="password">Password:</label>
        <PasswordWrapper>
          <input
            type={shouldShowPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={authData.password}
            onChange={(event) =>
              handleRequestAuthData(REQUEST.PASSWORD, event.target.value)
            }
          />
          <PasswordIconButton type="button" onClick={() => setShouldShowPassword(!shouldShowPassword)}>
            <img src={shouldShowPassword ? passwordShowIcon : passwordHideIcon} />
          </PasswordIconButton>
        </PasswordWrapper>
      </InputWrapper>
    </Wrapper>
  );
};

const PasswordIconButton = styled.button`
  width: auto;
  float: right;
  padding: 0;
  margin: -2.25rem 0.5rem 0 0;
  background: none;

  &:hover {
    background-color: transparent;
    opacity: 0.7;
  }
`;

const PasswordWrapper = styled.div`
  flex: 1 1 auto;
`;

export default RequestBasicAuth;
