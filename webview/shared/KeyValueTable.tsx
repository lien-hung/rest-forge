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
  handleRequestValue?: (type: OptionType, id: string, value: string) => void;
  handleRequestCheckbox?: (type: OptionType, id: string) => void;
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
}: IKeyValueTableProps) => {
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
              {!tableReadOnly && <th className="tableDelete"></th>}
            </tr>
          </thead>
          <tbody>
            {tableData.map(
              (
                { id, isChecked, key, value, rowReadOnly, authType }: any,
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
                          if (index === tableData.length - 1) {
                            type && addNewTableRow && addNewTableRow(type);
                            type && handleRequestCheckbox && handleRequestCheckbox(type, id);
                          }
                          type && handleRequestKey && handleRequestKey(type, id, event.target.value);
                        }}
                        readOnly={tableReadOnly || rowReadOnly}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="Value"
                        placeholder="Value"
                        value={value}
                        onChange={(event) => {
                          if (index === tableData.length - 1) {
                            type && addNewTableRow && addNewTableRow(type);
                            type && handleRequestCheckbox && handleRequestCheckbox(type, id);
                          }
                          type && handleRequestValue && handleRequestValue(type, id, event.target.value);
                        }}
                        readOnly={tableReadOnly || rowReadOnly}
                      />
                    </td>
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

const TableIconButton = styled.button`
  background: none;
  display: none;

  &:hover {
    background-color: transparent;
    opacity: 0.7;
  }
`;

const TableContainerWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 1.3rem;
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
    border: 0.1rem solid rgb(55, 55, 55);
  }

  tbody tr {
    &:hover button {
      display: inline-block;
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
