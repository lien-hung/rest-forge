import { StateCreator } from "zustand";
import { REQUEST } from "../../constants";
import { ApiKeyData, IOAuth2Data, IRequestDataSlice, ITreeViewResponse } from "./type";

const requestDataSlice: StateCreator<
  IRequestDataSlice,
  [],
  [],
  IRequestDataSlice
> = (set) => ({
  requestUrl: "",
  codeSnippetValue: "",
  bodyRawOption: "Text",
  bodyOption: REQUEST.NONE,
  requestMethod: REQUEST.GET,
  shouldBeautifyEditor: false,
  authOption: REQUEST.NO_AUTH,
  requestOption: REQUEST.PARAMS,
  codeSnippetOption: {
    language: "C",
    variant: "libcurl",
    editorLanguage: "c",
  },
  authData: { username: "", password: "", token: "", tokenPrefix: "Bearer" },
  apiKeyData: { key: "", value: "", addTo: REQUEST.ADD_TO_HEADERS },
  oauth2Data: {
    token: "",
    tokenType: REQUEST.ACCESS_TOKEN,
    prefix: "Bearer",
    addTo: REQUEST.ADD_TO_HEADERS
  },
  bodyRawData: "",
  graphqlData: { query: "", variables: "" },

  handleRequestUrlChange: (url: string) => set(() => ({ requestUrl: url })),

  handleRequestMethodChange: (method: string) =>
    set(() => ({ requestMethod: method })),

  handleRequestOptionChange: (option: string) =>
    set(() => ({ requestOption: option })),

  handleRequestAuthType: (type: string) => set(() => ({ authOption: type })),

  handleRequestAuthData: (authType: string, data: string) =>
    set((state) => ({
      authData: {
        ...state.authData,
        [authType]: data,
      },
    })),

  setApiKeyData: (data: ApiKeyData) => set(() => ({ apiKeyData: data })),

  setOAuth2Data: (data: IOAuth2Data) => set(() => ({ oauth2Data: data })),

  handleRequestBodyOption: (type: string) => set(() => ({ bodyOption: type })),

  handleBodyRawOption: (option: string) =>
    set(() => ({ bodyRawOption: option })),

  handleBodyRawOptionData: (data: string) =>
    set(() => ({ bodyRawData: data })),

  handleGraphqlQuery: (data) =>
    set((state) => ({
      graphqlData: { ...state.graphqlData, query: data },
    })),

  handleGraphqlVariables: (data) =>
    set((state) => ({
      graphqlData: { ...state.graphqlData, variables: data },
    })),

  handleBeautifyButton: () =>
    set((state) => ({
      shouldBeautifyEditor: !state.shouldBeautifyEditor,
    })),

  handleCodeSnippetOptionChange: (
    languageOption: string,
    variantOption: string,
    editorLanguageOption: string,
  ) =>
    set(() => ({
      codeSnippetOption: {
        language: languageOption,
        variant: variantOption,
        editorLanguage: editorLanguageOption,
      },
    })),

  handleCodeSnippetVariantChange: (variantOption: string) =>
    set((state) => ({
      codeSnippetOption: { ...state.codeSnippetOption, variant: variantOption },
    })),

  setCodeSnippetValue: (value: string) =>
    set(() => ({ codeSnippetValue: value })),

  handleTreeViewClick: (value: ITreeViewResponse) =>
    set((state) => {
      return {
        ...state,
        ...value,
      };
    }),
});

export default requestDataSlice;