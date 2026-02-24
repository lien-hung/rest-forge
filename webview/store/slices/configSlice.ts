import { StateCreator } from "zustand";
import { IConfigSlice } from "./type";

const configSlice: StateCreator<
  IConfigSlice,
  [],
  [],
  IConfigSlice
> = (set) => ({
  themeKind: 2,
  customMethods: [],

  setThemeKind: (themeKind) => {
    set(() => ({ themeKind }));
  },

  setConfig: (config) => {
    set(() => ({
      customMethods: config.customMethods
    }));
  },
});

export default configSlice;