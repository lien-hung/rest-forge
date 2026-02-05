export interface IRequestTreeItemState {
  url: string;
  method: string;
  headers: Headers;
  responseType: string;
  requestedTime: number;
  id: string;
  name: string;
  requestObject: RequestObject;
}

export interface Headers {
  [key: string]: string;
}

export interface RequestObject {
  requestMethod: string;
  requestUrl: string;
  authOption: string;
  authData: AuthData;
  bodyOption: string;
  bodyRawOption: string;
  bodyRawData: BodyRawData;
  keyValueTableData: KeyValueTableData[];
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

export interface IRequestObjectType {
  requestMethod: string;
  requestUrl: string;
  authOption: string;
  authData: AuthData;
  bodyOption: string;
  bodyRawOption: string;
  bodyRawData: BodyRawData;
  keyValueTableData: IKeyValueTable[];
}

export interface IAuthData {
  username: string;
  password: string;
  token: string;
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