export interface AuthData {
  username: string;
  password: string;
  token: string;
  tokenPrefix: string;
}

export interface BodyRawData {
  text: string;
  javascript: string;
  json: string;
  html: string;
  xml: string;
}

export interface ITableRow {
  id: string;
  isChecked: boolean;
  key: string;
  value: string | ArrayBuffer;
  rowReadOnly: boolean;
  authType?: string;
  prefix?: string;
  valueType?: string;
  fileName?: string;
  contentType?: string;
}

export interface IResizeBarSlice {
  requestMenuWidth: string;
  handleRequestWidthChange: (value: number) => void;
}

export interface IResponseDataSlice {
  requestInProcess: string;
  responseData: IResponseData | undefined;
  responseOption: string;
  responseBodyOption: string;
  responseBodyViewFormat: string;
  handleResponseData: (data: IResponseData) => void;
  handleRequestProcessStatus: (processStatus: string) => void;
  handleResponseOption: (option: string) => void;
  handleResponseBodyOption: (option: string) => void;
  handleResponseBodyViewFormat: (option: string) => void;
}

export interface IResponseData {
  body: string;
  headers: IResponseDataHeader[];
  headersLength: number;
  statusCode: number;
  statusText: string;
  requestTime: number;
  responseSize: number;
  message?: string;
  blobUri?: string;
}

export interface IResponseDataHeader {
  key: string;
  value: string;
}

export interface IRequestDataSlice extends ITreeViewResponse {
  codeSnippetValue: string;
  shouldBeautifyEditor: boolean;
  requestOption: string;
  codeSnippetOption: {
    language: string;
    variant: string;
    editorLanguage: string;
  };
  handleRequestUrlChange: (url: string) => void;
  handleRequestMethodChange: (method: string) => void;
  handleRequestAuthType: (authOption: string) => void;
  handleRequestAuthData: (authType: string, data: string) => void;
  setOAuth2Data: (data: IOAuth2Data) => void;
  handleRequestOptionChange: (option: string) => void;
  handleRequestAuthType: (type: string) => void;
  handleRequestBodyOption: (type: string) => void;
  handleBodyRawOption: (type: string) => void;
  handleBodyRawOptionData: (rawOption: string, data: string) => void;
  handleBeautifyButton: () => void;
  handleCodeSnippetOptionChange: (
    languageOption: string,
    variantOption: string,
    editorLanguageOption: string,
  ) => void;
  handleCodeSnippetVariantChange: (variantOption: string) => void;
  setCodeSnippetValue: (value: string) => void;
  handleTreeViewClick: (value: ITreeViewResponse) => void;
}

export interface ITreeViewResponse {
  authData: AuthData;
  authOption: string;
  oauth2Data: IOAuth2Data;
  requestUrl: string;
  requestMethod: string;
  bodyOption: string;
  bodyRawOption: string;
  bodyRawData: BodyRawData;
}

export type OptionType = keyof ITableData;

export interface ITableData {
  "Params": ITableRow[];
  "Headers": ITableRow[];
  "Form Data": ITableRow[];
  "Form Encoded": ITableRow[];
}

export interface RowDataParam {
  key?: string;
  value?: string;
  prefix?: string;
}

export interface IKeyValueTableDataSlice {
  tableData: ITableData;
  addNewTableRow: (type: OptionType) => void;
  deleteTableRow: (type: OptionType, id: string) => void;
  addRequestBodyHeaders: (value: string) => void;
  removeRequestBodyHeaders: () => void;
  addAuthTableRow: (authType: string, optionType: OptionType, data?: RowDataParam) => void;
  removeAuthTableRow: (type: OptionType) => void;
  handleRequestCheckbox: (type: OptionType, id: string) => void;
  handleRequestKey: (type: OptionType, id: string, detail: string) => void;
  handleRequestValue: (type: OptionType, id: string, detail: string | ArrayBuffer) => void;
  handleHeaderPrefix: (id: string, detail: string) => void;
  handleFormValueType: (id: string, detail: string) => void;
  handleFormFileName: (id: string, detail: string) => void;
  handleFormContentType: (id: string, detail: string) => void;
  handleParamsTableData: (params: ITableRow[]) => void;
  handleTreeViewTableData: (tableData: ITableData) => void;
}

export interface ExtensionConfig {
  customMethods: string[];
}

export interface IConfigSlice {
  themeKind: number;
  customMethods: string[];
  setThemeKind: (themeKind: number) => void;
  setConfig: (config: ExtensionConfig) => void;
}

export interface IOAuth2Token {
  name: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
  refresh_token?: string;
  access_token_url: string;
  client_id: string;
  client_secret: string;
  timestamp: number;
}

export interface IOAuth2Data {
  token: string;
  prefix: string;
  tokenType: string;
  addTo: string;
}

export interface IOAuth2TokenSlice {
  oauth2Tokens: IOAuth2Token[];  
  setOAuth2Tokens: (tokens: IOAuth2Token[]) => void;
}