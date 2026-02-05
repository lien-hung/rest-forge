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

export interface KeyValueTableData {
  id: string;
  optionType: string;
  isChecked: boolean;
  key: string;
  value: string;
  rowReadOnly: boolean;
  authType?: string;
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
  handleResponseData: (any) => void;
  handleRequestProcessStatus: (processStatus: string) => void;
  handleResponseOptionChange: (option: string) => void;
  handleResponseBodyOptionChange: (option: string) => void;
  handleResponseBodyViewFormatChange: (option: string) => void;
}

export interface IResponseData {
  type: string;
  data: string;
  headers: IResponseDataHeader[];
  headersLength: number;
  statusCode: number;
  statusText: string;
  requestTime: number;
  responseSize: number;
  message?: string;
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
  bodyRawData: BodyRawData;
  handleRequestUrlChange: (url: string) => void;
  handleRequestMethodChange: (method: string) => void;
  handleRequestAuthType: (authOption: string) => void;
  handleRequestAuthData: (authType: string, data: string) => void;
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
  requestUrl: string;
  requestMethod: string;
  bodyOption: string;
  bodyRawOption: string;
  bodyRawData: BodyRawData;
}

export interface IKeyValueTableDataSlice {
  keyValueTableData: KeyValueTableData[];
  addNewTableRow: (type: string) => void;
  deleteTableRow: (id: string) => void;
  addRequestBodyHeaders: (value: string) => void;
  removeRequestBodyHeaders: () => void;
  addAuthTableRow: (authType: string, optionType: string, key?: string, value?: string) => void;
  removeAuthTableRow: () => void;
  handleRequestCheckbox: (id: string) => void;
  handleRequestKey: (id: string, detail: string) => void;
  handleRequestValue: (id: string, detail: string) => void;
  handleTreeViewTableData: (headers: KeyValueTableData[]) => void;
}

export interface ExtensionConfig {
  customMethods: string[];
}

export interface IConfigSlice {
  customMethods: string[];
  setConfig: (config: ExtensionConfig) => void;
}