import { StateCreator } from "zustand";

import { COMMON, REQUEST } from "../../constants";
import { generateId } from "../../utils";
import { IKeyValueTableDataSlice } from "./type";

const keyValueTableDataSlice: StateCreator<
  IKeyValueTableDataSlice,
  [],
  [],
  IKeyValueTableDataSlice
> = (set) => ({
  tableData: {
    "Params": [
      {
        id: generateId(),
        isChecked: false,
        key: "",
        value: "",
        rowReadOnly: false,
      }
    ],
    "Headers": [
      {
        id: generateId(),
        isChecked: true,
        key: REQUEST.CACHE_CONTROL,
        value: REQUEST.NO_CACHE,
        rowReadOnly: true,
      },
      {
        id: generateId(),
        isChecked: true,
        key: REQUEST.ACCEPT,
        value: REQUEST.ANY_MIME_TYPE,
        rowReadOnly: true,
      },
      {
        id: generateId(),
        isChecked: true,
        key: REQUEST.ACCEPT_ENCODING,
        value: `${REQUEST.GZIP},${REQUEST.DEFLATE}`,
        rowReadOnly: true,
      },
      {
        id: generateId(),
        isChecked: true,
        key: REQUEST.CONNECTION,
        value: REQUEST.KEEP_ALIVE,
        rowReadOnly: true,
      },
      {
        id: generateId(),
        isChecked: false,
        key: "",
        value: "",
        rowReadOnly: false,
      },
    ],
    "Form Data": [
      {
        id: generateId(),
        isChecked: false,
        key: "",
        value: "",
        rowReadOnly: false,
        valueType: "",
        fileName: "",
        contentType: "",
      },
    ],
    "Form Encoded": [
      {
        id: generateId(),
        isChecked: false,
        key: "",
        value: "",
        rowReadOnly: false,
      },
    ]
  },

  handleRequestCheckbox: (type, dataId) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].map((row) =>
          dataId === row.id
            ? { ...row, isChecked: !row.isChecked }
            : row
        ),
      },
    })),

  handleRequestKey: (type, dataId, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].map((row) => dataId === row.id ? { ...row, key: detail } : row),
      },
    })),

  handleRequestValue: (type, dataId, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].map((row) => dataId === row.id ? { ...row, value: detail } : row),
      },
    })),

  handleHeaderPrefix: (dataId, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [COMMON.HEADERS]: state.tableData["Headers"].map((row) => dataId === row.id ? { ...row, prefix: detail } : row),
      },
    })),

  handleFormValueType: (dataId, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [REQUEST.FORM_DATA]: state.tableData["Form Data"].map((row) => dataId === row.id ? { ...row, valueType: detail } : row),
      }
    })),

  handleFormFileName: (dataId, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [REQUEST.FORM_DATA]: state.tableData["Form Data"].map((row) => dataId === row.id ? { ...row, fileName: detail } : row),
      }
    })),

  handleFormContentType: (dataId, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [REQUEST.FORM_DATA]: state.tableData["Form Data"].map((row) => dataId === row.id ? { ...row, contentType: detail } : row),
      }
    })),

  addRequestBodyHeaders: (headerValue) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [COMMON.HEADERS]: [
          {
            id: generateId(),
            isChecked: true,
            key: REQUEST.CONTENT_TYPE,
            value: headerValue,
            rowReadOnly: true,
          },
          ...state.tableData["Headers"],
        ]
      }
    })),

  removeRequestBodyHeaders: () => {
    set((state) => ({
      tableData: {
        ...state.tableData,
        [COMMON.HEADERS]: state.tableData["Headers"].filter(row => row.key !== REQUEST.CONTENT_TYPE),
      },
    }));
  },

  addAuthTableRow: (authType, optionType, data) => {
    set((state) => ({
      tableData: {
        ...state.tableData,
        [optionType]: [
          {
            id: generateId(),
            isChecked: true,
            key: data?.key || "",
            value: data?.value || "",
            rowReadOnly: true,
            authType,
            prefix: data?.prefix,
          },
          ...state.tableData[optionType],
        ],
      },
    }));
  },

  removeAuthTableRow: (type) => {
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].filter(row => !row.authType)
      },
    }));
  },

  addNewTableRow: (type) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: [
          ...state.tableData[type],
          {
            id: generateId(),
            isChecked: false,
            key: "",
            value: "",
            rowReadOnly: false,
          },
        ],
      }
    })),

  deleteTableRow: (type, dataId) => {
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].filter(row => row.id !== dataId),
      },
    }));
  },

  handleParamsTableData: (params) => {
    set((state) => ({
      tableData: {
        ...state.tableData,
        [REQUEST.PARAMS]: [...params],
      },
    }));
  },

  handleTreeViewTableData: (tableData) => {
    set(() => ({ tableData }));
  },
});

export default keyValueTableDataSlice;