import React, { memo } from "react";
import styled from "styled-components";
import { IResponseDataHeader, OptionType, ITableRow } from "../store/slices/type";

import deleteIcon from "../assets/svg/delete-icon.svg";

interface IKeyValueTableProps {
  type?: OptionType;
  title?: string;
  tableData: ITableRow[] | IResponseDataHeader[];
  tableReadOnly: boolean;
  addNewTableRow?: (type: OptionType, id?: string) => void;
  deleteTableRow?: (type: OptionType, id: string) => void;
  handleRequestKey?: (type: OptionType, id: string, value: string) => void;
  handleRequestValue?: (type: OptionType, id: string, value: string | ArrayBuffer) => void;
  handleRequestCheckbox?: (type: OptionType, id: string) => void;
  handleFormValueType?: (id: string, valueType: string) => void;
  handleFormFileName?: (id: string, fileName: string) => void;
  handleFormContentType?: (id: string, contentType: string) => void;
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
          <thead>
            <tr>
              {!tableReadOnly && <th></th>}
              <th>Key</th>
              <th>Value</th>
              {type === "Form Data" && <th>Content type</th>}
              {!tableReadOnly && <th className="tableDelete"></th>}
            </tr>
          </thead>
          <tbody>
            {tableData.map(
              (
                { id, isChecked, key, value, rowReadOnly, authType, valueType, contentType, fileName }: any,
                index: number,
              ) => (
                <React.Fragment key={id}>
                  <tr className={rowReadOnly && "readOnlyRow"}>
                    {!tableReadOnly && (
                      <th className={`tableCheckbox ${authType && "authRow"}`}>
                        {index !== tableData.length - 1 && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => type && handleRequestCheckbox && handleRequestCheckbox(type, id)}
                            disabled={authType}
                          />
                        )}
                      </th>
                    )}
                    <td>
                      <input
                        type="text"
                        name="Key"
                        placeholder="Key"
                        value={key}
                        onChange={(event) => {
                          if (index === tableData.length - 1) addRow(id, type);
                          type && handleRequestKey && handleRequestKey(type, id, event.target.value);
                        }}
                        readOnly={tableReadOnly || rowReadOnly}
                      />
                      {type === "Form Data" && (
                        <TypeOptionWrapper
                          value={valueType}
                          onChange={(event) => {
                            if (index === tableData.length - 1) addRow(id, type);
                            handleFormValueType && handleFormValueType(id, event.target.value);
                          }}
                        >
                          <option value="" selected hidden></option>
                          <option value="Text">Text</option>
                          <option value="File">File</option>
                        </TypeOptionWrapper>
                      )}
                    </td>
                    <td>
                      {(type === "Form Data" && valueType === "File") ? (
                        <FileInputWrapper>
                          <input
                            id={`file-${id}`}
                            type="file"
                            onChange={(event) => {
                              const curFiles = event.target.files;
                              if (curFiles && curFiles.length) {
                                curFiles[0].arrayBuffer().then(res => {
                                  handleRequestValue && handleRequestValue(type, id, res);
                                  handleFormFileName && handleFormFileName(id, curFiles[0].name);
                                });
                              }
                            }}
                          />
                          <FileNameDisplay>{fileName || "No file selected"}</FileNameDisplay>
                          <FileSelectButton htmlFor={`file-${id}`}>Select</FileSelectButton>
                        </FileInputWrapper>
                      ) : (
                        <input
                          type="text"
                          name="Value"
                          placeholder="Value"
                          value={value}
                          onChange={(event) => {
                            if (index === tableData.length - 1) addRow(id, type);
                            type && handleRequestValue && handleRequestValue(type, id, event.target.value);
                          }}
                          readOnly={tableReadOnly || rowReadOnly}
                        />
                      )}
                    </td>
                    {type === "Form Data" && (
                      <td>
                        <input
                          type="text"
                          name="Content type"
                          placeholder="Auto"
                          value={contentType}
                          onChange={(event) => {
                            if (index === tableData.length - 1) addRow(id, type);
                            handleFormContentType && handleFormContentType(id, event.target.value);
                          }}
                        />
                      </td>
                    )}
                    {!tableReadOnly && (
                      <th className="tableDelete">
                        {!rowReadOnly && index !== tableData.length - 1 && (
                          <TableIconButton
                            type="button"
                            onClick={() => type && deleteTableRow && deleteTableRow(type, id)}
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
  margin: -1.55rem -0.35rem 0 0;
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
  background: rgba(255, 255, 255, 0.03);
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
  border: 1px solid rgba(255, 255, 255, 0.06);
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
  display: flex;
  flex-direction: column;

  h2 {
    margin-bottom: 1.3rem;
    opacity: 0.9;
  }
`;

const Table = styled.table<{ readOnlyMode: boolean }>`
  width: 100%;
  border-collapse: collapse;

  thead {
    font-size: 1.1rem;
    user-select: none;
  }

  th,
  td {
    font-weight: 500;
    text-align: left;
    padding: 0.6rem;
    border: 0.1rem solid rgba(128, 128, 128, 0.7);
  }

  tbody tr {
    &:hover {
      select, button {
        visibility: visible;
      }
    }
  }

  input {
    background-color: transparent;
    color: var(--default-text);
    font-style: ${(props) => props.readOnlyMode && "italic"};
    font-weight: ${(props) => props.readOnlyMode && "300"};
    opacity: ${(props) => props.readOnlyMode && "0.75"};
  }

  .readOnlyRow {
    background-color: color-mix(in srgb, var(--vscode-editor-background) 90%, var(--vscode-foreground));

    input {
      font-style: italic;
    }
  }

  .tableCheckbox, .tableDelete {
    width: 2.5rem;
    text-align: center;
    padding: 0 0.15rem 0 0.2rem;
  }
  
  .tableDelete {
    border-left: hidden;
  }
  
  .authRow input {
    &:checked:before {
      border-bottom-color: rgba(128, 128, 128, 0.7);
      border-right-color: rgba(128, 128, 128, 0.7);
    }
  }
`;

export default memo(KeyValueTable);
