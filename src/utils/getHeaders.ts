import { TYPE } from "../constants";
import { Buffer } from "buffer";

import {
  IHeaderAuth,
  IParameterKeyValueData,
  IRequestHeaderInformation,
} from "./type";

function getHeaders(
  keyValueData: IParameterKeyValueData[],
  authOption: string,
  { username, password, token, tokenPrefix }: IHeaderAuth,
) {
  const headersObject: IRequestHeaderInformation = {};

  const headersData = keyValueData.filter(
    (data) => data.optionType === TYPE.HEADERS && data.isChecked,
  );

  if (!headersData.length) {
    return { key: "" };
  };

  for (const { key, value } of headersData) {
    headersObject[key] = value;
  }

  if (authOption === TYPE.BASIC_AUTH) {
    headersObject[TYPE.AUTHORIZATION] = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  if (authOption === TYPE.BEARER_TOKEN) {
    headersObject[TYPE.AUTHORIZATION] = `${tokenPrefix} ${token}`;
  }

  return headersObject;
}

export default getHeaders;
