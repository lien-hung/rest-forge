import { StateCreator } from "zustand";
import { IEnvironmentDataSlice } from "./type";

const environmentSlice: StateCreator<
  IEnvironmentDataSlice,
  [],
  [],
  IEnvironmentDataSlice
> = (set) => ({
  variables: [
    {
      isChecked: false,
      key: "",
      value: "",
      isHidden: true,
    }
  ],
  activeVariables: {},

  setVariables(data) {
    set(() => ({ variables: data.map(v => ({ ...v, isHidden: true })) }));
  },

  addVariable() {
    set((state) => ({
      variables: [...state.variables, { isChecked: false, key: "", value: "", isHidden: true }]
    }));
  },

  deleteVariable(index) {
    set((state) => ({
      variables: state.variables.filter((_, i) => i !== index)
    }));
  },

  handleVariableCheckbox(index) {
    set((state) => ({
      variables: state.variables.map((variable, i) =>
        i === index ? { ...variable, isChecked: !variable.isChecked } : variable
      )
    }));
  },

  handleVariableKey(index, value) {
    set((state) => ({
      variables: state.variables.map((variable, i) =>
        i === index ? { ...variable, key: value } : variable
      )
    }));
  },

  handleVariableValue(index, value) {
    set((state) => ({
      variables: state.variables.map((variable, i) =>
        i === index ? { ...variable, value } : variable
      )
    }));
  },

  toggleShowVariable(index) {
    set((state) => ({
      variables: state.variables.map((variable, i) =>
        i === index ? { ...variable, isHidden: !variable.isHidden } : variable
      )
    }));
  },

  setActiveVariables(data) {
    set(() => ({ activeVariables: data }));
  },
});

export default environmentSlice;