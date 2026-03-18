export interface ITableRow {
  isChecked: boolean;
  key: string;
  value: string | ArrayBuffer;
  valueType?: string;
  fileName?: string;
}

export type OptionType = keyof ITableData;

export interface ITableData {
  "Params": ITableRow[];
  "Headers": ITableRow[];
  "Form Data": ITableRow[];
  "Form Encoded": ITableRow[];
}

export interface IGraphqlData {
  query: string;
  variables: string;
}

export interface IAuthData {
  username: string;
  password: string;
  token: string;
  tokenPrefix: string;
}

export interface IEditorTheme {
  base: "vs" | "vs-dark";
  colors: {
    [key: string]: string;
  };
  fontFamily: string;
}

export interface ITokenColor {
  token: string;
  foreground?: string;
  background?: string;
  fontStyle?: string;
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

export interface IOAuth2RefreshRequest {
  accessTokenUrl: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}