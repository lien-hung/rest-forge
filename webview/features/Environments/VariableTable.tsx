import React from "react";
import styled from "styled-components";

import deleteIcon from "../../assets/svg/delete-icon.svg";
import hideIcon from "../../assets/svg/password-hide.svg";
import showIcon from "../../assets/svg/password-show.svg";
import { IEnvironmentVariable } from "../../store/slices/type";

interface IVariableTableProps {
  variables: IEnvironmentVariable[];
  addVariable: () => void;
  deleteVariable: (index: number) => void;
  handleVariableCheckbox: (index: number) => void;
  handleVariableKey: (index: number, value: string) => void;
  handleVariableValue: (index: number, value: string) => void;
  toggleShowVariable: (index: number) => void;
}

const VariableTable = ({
  variables,
  addVariable,
  deleteVariable,
  handleVariableCheckbox,
  handleVariableKey,
  handleVariableValue,
  toggleShowVariable,
}: IVariableTableProps) => {
  const addRow = (index: number) => {
    addVariable();
    handleVariableCheckbox(index);
  };

  return (
    <Table>
      <tbody>
        {variables.map(
          (
            { isChecked, key, value, isHidden }: IEnvironmentVariable,
            index: number
          ) => (
            <tr key={index}>
              <th className="table-checkbox">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleVariableCheckbox(index)}
                  disabled={index === variables.length - 1}
                />
              </th>
              <td>
                <input
                  type="text"
                  name="Key"
                  placeholder="Key"
                  value={key}
                  onInput={() => index === variables.length - 1 && addRow(index)}
                  onChange={(event) => handleVariableKey(index, event.target.value)}
                />
              </td>
              <td className="value-wrapper">
                <input
                  type={isHidden ? "password" : "text"}
                  name="Value"
                  placeholder="Value"
                  value={value}
                  onInput={() => index === variables.length - 1 && addRow(index)}
                  onChange={(event) => handleVariableValue(index, event.target.value)}
                />
                <button onClick={() => toggleShowVariable(index)}>
                  <img src={isHidden ? hideIcon : showIcon} />
                </button>
              </td>
              <th className="delete-cell">
                {index !== variables.length - 1 && (
                  <TableIconButton
                    type="button"
                    onClick={() => deleteVariable(index)}
                  >
                    <img src={deleteIcon} />
                  </TableIconButton>
                )}
              </th>
            </tr>
          )
        )}
      </tbody>
    </Table>
  );
};

const TableIconButton = styled.button`
  background: none;
  visibility: hidden;

  &:hover {
    background-color: transparent;
    opacity: 0.7;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.3rem;

  th,
  td {
    text-align: left;
    padding: 0.6rem;
  }

  tbody tr {
    &:hover {
      button {
        visibility: visible;
      }
    }
  }

  input {
    background-color: transparent;
    color: var(--default-text);
  }

  .value-wrapper {
    button {
      width: auto;
      float: right;
      padding: 0;
      margin-top: -1.8rem;
      background: none;

      &:hover {
        background-color: transparent;
        opacity: 0.7;
      }
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
`;

export default VariableTable;