import { StateCreator } from "zustand";
import { COMMON, RESPONSE } from "../../constants";

import { IResponseData, IResponseDataSlice } from "./type";

const responseDataSlice: StateCreator<
  IResponseDataSlice,
  [],
  [],
  IResponseDataSlice
> = (set) => ({
  requestInProcess: "",
  responseData: undefined,
  responseOption: COMMON.BODY,
  responseBodyOption: RESPONSE.PRETTY,
  responseBodyViewFormat: COMMON.JSON,

  handleResponseData: (data: IResponseData) =>
    set(() => ({ responseData: data })),

  handleRequestProcessStatus: (processStatus: string) =>
    set(() => ({ requestInProcess: processStatus })),

  handleResponseOption: (option: string) =>
    set(() => ({ responseOption: option })),

  handleResponseBodyOption: (option: string) =>
    set(() => ({ responseBodyOption: option })),

  handleResponseBodyViewFormat: (option: string) =>
    set(() => ({ responseBodyViewFormat: option })),
});

export default responseDataSlice;
