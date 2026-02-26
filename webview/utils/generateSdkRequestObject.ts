import { Buffer } from "buffer";
import { Request } from "postman-collection";

import { REQUEST } from "../constants";
import { IAuthData, IBodyRawData, ITableData, ITableRow, OptionType } from "./type";

const generateSdkRequestObject = (
  url: string,
  method: string,
  tableData: ITableData,
  authOption: string,
  authData: IAuthData,
  bodyOption: OptionType,
  bodyRawOption: string,
  bodyRawData: IBodyRawData
) => {
  const requestHeaders = tableData["Headers"].filter((data) => data.key.length > 0);
  const bodyData = tableData[bodyOption]
    ? tableData[bodyOption]
        .filter((data) => data.key.length > 0)
        .map((data) => data.value instanceof ArrayBuffer
          ? { ...data, src: `C:/fakepath/${data.fileName}`, type: data.valueType.toLowerCase() }
          : data)
    : new Array<ITableRow>();
  
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
    header: [...requestHeaders, authHeaderObject],
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
