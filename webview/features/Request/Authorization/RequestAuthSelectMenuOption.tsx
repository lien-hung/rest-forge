import React from "react";

import { REQUEST } from "../../../constants/index";
import useStore from "../../../store/useStore";
import RequestAuthApiKey from "./RequestAuthApiKey";
import RequestBearerToken from "./RequestAuthBearerToken";
import RequestBasicAuth from "./RequestBasicAuth";
import RequestNoAuth from "./RequestNoAuth";
import RequestOAuth2 from "./RequestOAuth2";

const RequestAuthSelectMenuOption = () => {
  const authOption = useStore((state) => state.authOption);

  switch (authOption) {
    case REQUEST.API_KEY:
      return <RequestAuthApiKey />;
    case REQUEST.BEARER_TOKEN:
      return <RequestBearerToken />;
    case REQUEST.BASIC_AUTH:
      return <RequestBasicAuth />;
    case REQUEST.OAUTH2:
      return <RequestOAuth2 />;
    default:
      return <RequestNoAuth />;
  }
};

export default RequestAuthSelectMenuOption;
