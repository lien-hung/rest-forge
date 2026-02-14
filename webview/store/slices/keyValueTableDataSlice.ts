import { StateCreator } from "zustand";
import { COMMON, REQUEST } from "../../constants";
import { IKeyValueTableDataSlice } from "./type";

const keyValueTableDataSlice: StateCreator<
  IKeyValueTableDataSlice,
  [],
  [],
  IKeyValueTableDataSlice
> = (set) => ({
  keyValueTableData: [
    {
      id: crypto.randomUUID(),
      optionType: REQUEST.PARAMS,
      isChecked: false,
      key: "",
      value: "",
      rowReadOnly: false,
    },

    {
      id: crypto.randomUUID(),
      optionType: COMMON.HEADERS,
      isChecked: true,
      key: REQUEST.CACHE_CONTROL,
      value: REQUEST.NO_CACHE,
      rowReadOnly: true,
    },
    {
      id: crypto.randomUUID(),
      optionType: COMMON.HEADERS,
      isChecked: true,
      key: REQUEST.ACCEPT,
      value: REQUEST.ANY_MIME_TYPE,
      rowReadOnly: true,
    },
    {
      id: crypto.randomUUID(),
      optionType: COMMON.HEADERS,
      isChecked: true,
      key: REQUEST.ACCEPT_ENCODING,
      value: `${REQUEST.GZIP},${REQUEST.DEFLATE}`,
      rowReadOnly: true,
    },
    {
      id: crypto.randomUUID(),
      optionType: COMMON.HEADERS,
      isChecked: true,
      key: REQUEST.CONNECTION,
      value: REQUEST.KEEP_ALIVE,
      rowReadOnly: true,
    },
    {
      id: crypto.randomUUID(),
      optionType: COMMON.HEADERS,
      isChecked: false,
      key: "",
      value: "",
      rowReadOnly: false,
    },
    
    {
      id: crypto.randomUUID(),
      optionType: REQUEST.FORM_DATA,
      isChecked: false,
      key: "",
      value: "",
      rowReadOnly: false,
    },
    {
      id: crypto.randomUUID(),
      optionType: REQUEST.FORM_URLENCODED,
      isChecked: false,
      key: "",
      value: "",
      rowReadOnly: false,
    },
  ],

  handleRequestCheckbox: (dataId) =>
    set((state) => ({
      keyValueTableData: state.keyValueTableData.map((tableData) =>
        dataId === tableData.id
          ? { ...tableData, isChecked: !tableData.isChecked }
          : tableData,
      ),
    })),

  handleRequestKey: (dataId, detail) =>
    set((state) => ({
      keyValueTableData: state.keyValueTableData.map((tableData) =>
        dataId === tableData.id ? { ...tableData, key: detail } : tableData,
      ),
    })),

  handleRequestValue: (dataId, detail) =>
    set((state) => ({
      keyValueTableData: state.keyValueTableData.map((tableData) =>
        dataId === tableData.id ? { ...tableData, value: detail } : tableData,
      ),
    })),

  handleHeaderPrefix: (dataId, detail) =>
    set((state) => ({
      keyValueTableData: state.keyValueTableData.map((tableData) =>
        dataId === tableData.id ? { ...tableData, prefix: detail } : tableData,
      ),      
    })),

  addRequestBodyHeaders: (headerValue) =>
    set((state) => ({
      keyValueTableData: [
        {
          id: crypto.randomUUID(),
          optionType: COMMON.HEADERS,
          isChecked: true,
          key: REQUEST.CONTENT_TYPE,
          value: headerValue,
          rowReadOnly: true,
        },
        ...state.keyValueTableData,
      ],
    })),

  removeRequestBodyHeaders: () => {
    set((state) => ({
      keyValueTableData: state.keyValueTableData.filter(
        (keyValueData) => keyValueData.key !== REQUEST.CONTENT_TYPE,
      ),
    }));
  },

  addAuthTableRow: (authType, optionType, key, value, prefix) => {
    set((state) => ({
      keyValueTableData: [
        {
          id: crypto.randomUUID(),
          optionType: optionType,
          isChecked: true,
          key: key || "",
          value: value || "",
          rowReadOnly: true,
          authType: authType,
          prefix: prefix,
        },
        ...state.keyValueTableData,
      ],
    }));
  },

  removeAuthTableRow: () => {
    set((state) => ({
      keyValueTableData: state.keyValueTableData.filter(
        (keyValueData) => !keyValueData.authType
      ),
    }));
  },

  addNewTableRow: (type) =>
    set((state) => ({
      keyValueTableData: [
        ...state.keyValueTableData,
        {
          id: crypto.randomUUID(),
          optionType: type,
          isChecked: false,
          key: "",
          value: "",
          rowReadOnly: false,
        },
      ],
    })),

  deleteTableRow: (dataId) => {
    set((state) => ({
      keyValueTableData: state.keyValueTableData.filter(
        (tableData) => tableData.id !== dataId,
      ),
    }));
  },

  handleTreeViewTableData: (data) => {
    set(() => ({
      keyValueTableData: [...data],
    }));
  },
});

export default keyValueTableDataSlice;