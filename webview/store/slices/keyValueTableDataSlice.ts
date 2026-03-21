import { StateCreator } from "zustand";

import { COMMON, REQUEST } from "../../constants";
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
        isChecked: false,
        key: "",
        value: "",
      }
    ],
    "Headers": [
      {
        isChecked: true,
        key: REQUEST.CACHE_CONTROL,
        value: REQUEST.NO_CACHE,
        readOnly: true,
      },
      {
        isChecked: true,
        key: REQUEST.ACCEPT,
        value: REQUEST.ANY_MIME_TYPE,
        readOnly: true,
      },
      {
        isChecked: true,
        key: REQUEST.ACCEPT_ENCODING,
        value: `${REQUEST.GZIP},${REQUEST.DEFLATE}`,
        readOnly: true,
      },
      {
        isChecked: true,
        key: REQUEST.CONNECTION,
        value: REQUEST.KEEP_ALIVE,
        readOnly: true,
      },
      {
        isChecked: false,
        key: "",
        value: "",
      },
    ],
    "Form Data": [
      {
        isChecked: false,
        key: "",
        value: "",
      },
    ],
    "Form Encoded": [
      {
        isChecked: false,
        key: "",
        value: "",
      },
    ]
  },

  handleRequestCheckbox: (type, dataIndex) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].map((row, index) =>
          dataIndex === index ? { ...row, isChecked: !row.isChecked } : row
        ),
      },
    })),

  handleRequestKey: (type, dataIndex, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].map((row, index) => 
          dataIndex === index ? { ...row, key: detail } : row
        ),
      },
    })),

  handleRequestValue: (type, dataIndex, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].map((row, index) =>
          dataIndex === index ? { ...row, value: detail } : row
        ),
      },
    })),

  handleHeaderPrefix: (dataIndex, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [COMMON.HEADERS]: state.tableData["Headers"].map((row, index) =>
          dataIndex === index ? { ...row, prefix: detail } : row
        ),
      },
    })),

  handleFormValueType: (dataIndex, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [REQUEST.FORM_DATA]: state.tableData["Form Data"].map((row, index) =>
          dataIndex === index ? { ...row, valueType: detail } : row
        ),
      }
    })),

  handleFormFileName: (dataIndex, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [REQUEST.FORM_DATA]: state.tableData["Form Data"].map((row, index) =>
          dataIndex === index ? { ...row, fileName: detail } : row
        ),
      }
    })),

  handleFormContentType: (dataIndex, detail) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [REQUEST.FORM_DATA]: state.tableData["Form Data"].map((row, index) =>
          dataIndex === index ? { ...row, contentType: detail } : row
        ),
      }
    })),

  addRequestBodyHeaders: (headerValue) =>
    set((state) => ({
      tableData: {
        ...state.tableData,
        [COMMON.HEADERS]: [
          {
            isChecked: true,
            key: REQUEST.CONTENT_TYPE,
            value: headerValue,
            readOnly: true,
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
            isChecked: true,
            key: data?.key || "",
            value: data?.value || "",
            readOnly: true,
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
        [type]: [...state.tableData[type], { isChecked: false, key: "", value: "" }],
      }
    })),

  deleteTableRow: (type, dataIndex) => {
    set((state) => ({
      tableData: {
        ...state.tableData,
        [type]: state.tableData[type].filter((_, index) => index !== dataIndex),
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