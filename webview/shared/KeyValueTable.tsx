import React, { memo } from "react";
import styled from "styled-components";
import { IResponseDataHeader, OptionType, ITableRow } from "../store/slices/type";

import deleteIcon from "../assets/svg/delete-icon.svg";

interface IKeyValueTableProps {
  type?: OptionType;
  title?: string;
  tableData: ITableRow[] | IResponseDataHeader[];
  tableReadOnly: boolean;
  addNewTableRow?: (type: OptionType) => void;
  deleteTableRow?: (type: OptionType, index: number) => void;
  handleRequestKey?: (type: OptionType, index: number, value: string) => void;
  handleRequestValue?: (type: OptionType, index: number, value: string | ArrayBuffer) => void;
  handleRequestCheckbox?: (type: OptionType, index: number) => void;
  handleFormValueType?: (index: number, valueType: string) => void;
  handleFormFileName?: (index: number, fileName: string) => void;
  handleFormContentType?: (index: number, contentType: string) => void;
}

const KeyValueTable = ({
  type,
  title,
  tableData,
  tableReadOnly,
  addNewTableRow,
  deleteTableRow,
  handleRequestKey,
  handleRequestValue,
  handleRequestCheckbox,
  handleFormValueType,
  handleFormFileName,
  handleFormContentType,
}: IKeyValueTableProps) => {
  const addRow = (id: any, type?: OptionType) => {
    type && addNewTableRow && addNewTableRow(type);
    type && handleRequestCheckbox && handleRequestCheckbox(type, id);
  };

  return (
    <TableContainerWrapper>
      <TableContainer>
        {title && <h2>{title}</h2>}
        <Table readOnlyMode={tableReadOnly}>
          {tableReadOnly && (
            <thead>
              <tr>
                <th className="col-key">Key</th>
                <th className="col-value">Value</th>
              </tr>
            </thead>
          )}
          <tbody>
            {tableData.map(
              (
                { isChecked, key, value, readOnly, authType, valueType, contentType, fileName }: any,
                index: number,
              ) => (
                <React.Fragment key={index}>
                  <tr className={readOnly && "readonly-row"}>
                    {!tableReadOnly && (
                      <th className={`table-checkbox ${authType && "auth-row"}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => type && handleRequestCheckbox && handleRequestCheckbox(type, index)}
                          disabled={authType || index === tableData.length - 1}
                        />
                      </th>
                    )}
                    <td>
                      {tableReadOnly ? key : (
                        <input
                          type="text"
                          name="Key"
                          placeholder="Key"
                          value={key}
                          onChange={(event) => {
                            if (index === tableData.length - 1) addRow(index, type);
                            type && handleRequestKey && handleRequestKey(type, index, event.target.value);
                          }}
                          readOnly={readOnly}
                        />
                      )}
                      {type === "Form Data" && (
                        <TypeOptionWrapper
                          value={valueType}
                          onChange={(event) => {
                            if (index === tableData.length - 1) addRow(index, type);
                            handleFormValueType && handleFormValueType(index, event.target.value);
                          }}
                        >
                          <option value="" selected hidden></option>
                          <option value="Text">Text</option>
                          <option value="File">File</option>
                        </TypeOptionWrapper>
                      )}
                    </td>
                    <td>
                      {tableReadOnly ? value : (type === "Form Data" && valueType === "File") ? (
                        <FileInputWrapper>
                          <input
                            id={`file-${index}`}
                            type="file"
                            onChange={(event) => {
                              const curFiles = event.target.files;
                              if (curFiles && curFiles.length) {
                                curFiles[0].arrayBuffer().then(res => {
                                  handleRequestValue && handleRequestValue(type, index, res);
                                  handleFormFileName && handleFormFileName(index, curFiles[0].name);
                                });
                              }
                            }}
                          />
                          <FileNameDisplay>{fileName || "No file selected"}</FileNameDisplay>
                          <FileSelectButton htmlFor={`file-${index}`}>Select</FileSelectButton>
                        </FileInputWrapper>
                      ) : (
                        <input
                          type="text"
                          name="Value"
                          placeholder="Value"
                          value={value}
                          onChange={(event) => {
                            if (index === tableData.length - 1) addRow(index, type);
                            type && handleRequestValue && handleRequestValue(type, index, event.target.value);
                          }}
                          readOnly={tableReadOnly || readOnly}
                        />
                      )}
                    </td>
                    {type === "Form Data" && (
                      <td>
                        <input
                          type="text"
                          placeholder="Content type"
                          value={contentType}
                          onChange={(event) => {
                            if (index === tableData.length - 1) addRow(index, type);
                            handleFormContentType && handleFormContentType(index, event.target.value);
                          }}
                        />
                      </td>
                    )}
                    {!tableReadOnly && (
                      <th className="delete-cell">
                        {!readOnly && index !== tableData.length - 1 && (
                          <TableIconButton
                            type="button"
                            onClick={() => type && deleteTableRow && deleteTableRow(type, index)}
                          >
                            <img src={deleteIcon} />
                          </TableIconButton>
                        )}
                      </th>
                    )}
                  </tr>
                </React.Fragment>
              ),
            )}
          </tbody>
        </Table>
      </TableContainer>
    </TableContainerWrapper>
  );
};

const TypeOptionWrapper = styled.select`
  visibility: hidden;
  width: auto;
  float: right;
  margin-top: -1.8rem;
  font-size: 1rem;
  font-weight: 500;
  background-color: var(--vscode-editor-background);
  color: var(--default-text);
`;

const FileInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FileNameDisplay = styled.div`
  background: rgba(255 255 255 / 0.03);
  color: var(--default-text);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
`;

const FileSelectButton = styled.label`
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(255 255 255 / 0.06);
  background: transparent;
  font-size: 0.95rem;

  &:hover {
    opacity: 0.9;
  }
`;

const TableIconButton = styled.button`
  background: none;
  visibility: hidden;

  &:hover {
    background-color: transparent;
    opacity: 0.7;
  }
`;

const TableContainerWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 1.3rem;
  flex: 1 1 auto;
  overflow-y: auto;
`;

const TableContainer = styled.div`
  width: 100%;
  height: max-content;
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;

  h2 {
    margin-bottom: 1.3rem;
    opacity: 0.9;
  }
`;

const Table = styled.table<{ readOnlyMode: boolean }>`
  width: 100%;
  table-layout: ${(props) => props.readOnlyMode && "fixed"};
  border-collapse: collapse;

  thead {
    font-size: 1.1rem;
    user-select: none;
  }

  th {
    font-weight: 500;
  }

  td {
    font-style: ${(props) => props.readOnlyMode && "italic"};
    font-weight: ${(props) => props.readOnlyMode && "300"};
    opacity: ${(props) => props.readOnlyMode && "0.75"};
  }

  th,
  td {
    text-align: left;
    padding: 0.6rem;
    word-wrap: ${(props) => props.readOnlyMode && "break-word"};
    border: ${(props) => props.readOnlyMode && "0.1rem solid rgb(55 55 55)"};
  }

  tbody tr {
    &:hover {
      select, button {
        visibility: visible;
      }
    }
  }

  tbody:last-child {
    margin-bottom: 2rem;
  }

  input {
    background-color: transparent;
    color: var(--default-text);
    font-style: ${(props) => props.readOnlyMode && "italic"};
    font-weight: ${(props) => props.readOnlyMode && "300"};
    opacity: ${(props) => props.readOnlyMode && "0.75"};
  }

  .col-key {
    width: 30%;
  }

  .col-value {
    width: 70%;
  }

  .readonly-row {
    background-color: color-mix(in srgb, var(--vscode-editor-background) 90%, var(--vscode-foreground));

    input {
      font-style: italic;
    }
  }

  .table-checkbox, .delete-cell {
    width: 2.5rem;
    text-align: center;
    padding: 0 0.15rem 0 0.2rem;
  }
  
  .delete-cell {
    border-left: hidden;
  }
  
  .auth-row input {
    &:checked:before {
      border-bottom-color: rgba(128 128 128 / 0.7);
      border-right-color: rgba(128 128 128 / 0.7);
    }
  }
`;

export default memo(KeyValueTable);
