import { Buffer } from "buffer";
import { Request } from "postman-collection";

import { COMMON, REQUEST } from "../constants";
import { IAuthData, IBodyRawData, IParameterString } from "./type";

const generateSdkRequestObject = (
  url: string,
  method: string,
  keyValueTableData: IParameterString[],
  authOption: string,
  authData: IAuthData,
  bodyOption: string,
  bodyRawOption: string,
  bodyRawData: IBodyRawData
) => {
  const requestHeader = keyValueTableData.filter(
    (data) => data.optionType === COMMON.HEADERS && data.key.length > 0,
  );
  const bodyData = keyValueTableData.filter(
    (data) => data.optionType === bodyOption && data.key.length > 0,
  );
  const { username, password, token, tokenPrefix } = authData;
  let authHeaderObject: any = undefined;
  let authMode: "noauth" | "bearer" | "basic" = "noauth";
  let bodyMode = "";

  switch (authOption) {
    case REQUEST.BEARER_TOKEN:
      authMode = "bearer";
      authHeaderObject = {
        key: REQUEST.AUTH,
        value: `${tokenPrefix} ${token}`,
      };
      break;
    case REQUEST.BASIC_AUTH:
      authMode = "basic";
      authHeaderObject = {
        key: REQUEST.AUTH,
        value: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      };
      break;
    default:
      break;
  }

  switch (bodyOption) {
    case REQUEST.FORM_DATA:
      bodyMode = "formdata";
      break;
    case REQUEST.FORM_URLENCODED:
      bodyMode = "urlencoded";
      break;
    case REQUEST.RAW:
      bodyMode = "raw";
      break;
    default:
      break;
  }

  const requestObject = new Request({
    method: method,
    url: url,
    header: [...requestHeader, authHeaderObject],
    body: {
      mode: bodyMode,
      [bodyMode]: bodyData.length
        ? bodyData
        : bodyRawData[bodyRawOption.toLowerCase() as keyof IBodyRawData],
    },
    auth: {
      type: authMode,
      [authMode]: authHeaderObject,
    },
  });

  return requestObject;
};

export default generateSdkRequestObject;
