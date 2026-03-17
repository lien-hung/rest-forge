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
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Headers;
  body: string | FormData | URLSearchParams;
  requestedTime: number;
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
  oauth2Data: IOAuth2Data;
  bodyOption: string;
  bodyRawOption: string;
  bodyRawData: IBodyRawData;
  tableData: ITableData;
  graphqlData: IGraphqlData;
}

export interface IRequestHeaderInformation {
  [key: string]: string;
}

export interface IParameterKeyValueData {
  optionType: string;
  isChecked: boolean;
  key: string;
  value: string | File;
}

export interface IBodyRawData {
  text: string;
  javascript: string;
  json: string;
  html: string;
  xml: string;
}

export interface IGraphqlData {
  query: string;
  variables: string;
}

export interface IHeaderAuth {
  username: string;
  password: string;
  token: string;
  tokenPrefix: string;
}

export interface ITableRow {
  id: string;
  isChecked: boolean;
  key: string;
  value: string | File;
  rowReadOnly: boolean;
  authType?: string;
  prefix?: string;
  valueType?: string;
  fileName?: string;
  contentType?: string;
}

export interface ITableData {
  "Params": ITableRow[];
  "Headers": ITableRow[];
  "Form Data": ITableRow[];
  "Form Encoded": ITableRow[];
}

export interface IOAuth2Data {
  token: string;
  prefix: string;
  tokenType: string;
  addTo: string;
}

export interface IRequestData {
  url: string;
  method: string;
  headers: IRequestHeaderInformation;
  body: string | FormData | URLSearchParams;
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