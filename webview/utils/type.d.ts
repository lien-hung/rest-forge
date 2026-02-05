export interface IParameterString {
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