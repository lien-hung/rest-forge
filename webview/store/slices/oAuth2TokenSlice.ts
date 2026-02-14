import { StateCreator } from "zustand";
import { IOAuth2TokenSlice } from "./type";

const oAuth2TokenSlice: StateCreator<
  IOAuth2TokenSlice,
  [],
  [],
  IOAuth2TokenSlice
> = (set) => ({
  oauth2Tokens: [],

  setOAuth2Tokens: (tokens) =>
    set(() => ({ oauth2Tokens: tokens })),
});

export default oAuth2TokenSlice;