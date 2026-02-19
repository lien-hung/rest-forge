export interface IOAuth2Token {
  name: string;
  access_token: string;
  type: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
  refresh_token?: string;
  access_token_url: string;
  client_id: string;
  client_secret: string;
  timestamp: number;
}

export interface IRequestTreeItemState {
  url: string;
  method: string;
  headers: Headers;
  responseType: string;
  requestedTime: number;
  id: string;
  name: string;
  requestObject: IRequestObject;
}

export interface Headers {
  [key: string]: string;
}

export interface IRequestObject {
  requestMethod: string;
  requestUrl: string;
  authOption: string;
  authData: IAuthData;
  bodyOption: string;
  bodyRawOption: string;
  bodyRawData: IBodyRawData;
  keyValueTableData: IKeyValueTable[];
}

export interface IRequestHeaderInformation {
  [key: string]: string;
}

export interface IParameterKeyValueData {
  optionType: string;
  isChecked: boolean;
  key: string;
  value: string;
}

export interface IBodyRawData {
  text: string;
  javascript: string;
  json: string;
  html: string;
  xml: string;
}

export interface IHeaderAuth {
  username: string;
  password: string;
  token: string;
  tokenPrefix: string;
}

export interface IKeyValueTable {
  optionType: string;
  isChecked: boolean;
  key: string;
  value: string;
}

export interface IRequestData {
  url: string;
  method: string;
  headers: IRequestHeaderInformation;
  data: string | FormData | URLSearchParams;
  responseType: string;
}

export interface IExtensionConfig {
  customMethods: string[];
}

export interface IOAuth2Request {
  authorizationUrl: string;
  accessTokenUrl: string;
  callbackUrl: string;
  clientId: string;
  clientSecret: string;
  credsPlacement: string;
  pkce: boolean;
  codeVerifier?: string;
  challengeType?: string;
  scope?: string;
  state?: string;
}

export interface IMultipartUpload {
  name: string;
  value: string;
  type: "file" | "text";
  enabled: boolean;
}

export interface ICurlRequest {
  url: string;
  method: string;
  headers: { [key: string]: string };
  auth: {
    mode: "basic",
    basic: {
      username: string;
      password: string;
    }
  };
  data?: string;
  multipartUploads: IMultipartUpload[];
  cookies: { [key: string]: string | undefined };
  cookieString: string;
  urlWithoutQuery: string;
  queries: ({ name: string, value: string } | undefined)[];
  isQuery?: boolean;
  isDataRaw: boolean;
  isDataBinary: boolean;
  insecure: boolean;
  [otherProp: string]: any;
}