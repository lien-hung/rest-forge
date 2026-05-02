import { IAuthData, ITableData, OptionType } from "./type";

export function resolveVariable(str: string, variables: { [key: string]: string }) {
  const matches = [...str.matchAll(/\{\{([^}]+)\}\}/gi)];
  const stripBracket = (s: string) => s.replace("{{", "").replace("}}", "");

  for (const match of matches) {
    const varName = stripBracket(match[0]);
    if (variables[varName]) {
      str = str.replace(match[0], variables[varName]);
    } else {
      str = str.replace(match[0], "");
    }
  }
  return str;
}

export function resolveAuthData(authData: IAuthData, variables: { [key: string]: string }) {
  let key: keyof IAuthData, newAuthData = <IAuthData>{};
  for (key in authData) {
    if (key === "tokenPrefix") {
      newAuthData[key] = authData[key];
    }
    newAuthData[key] = resolveVariable(authData[key], variables);
  }
  return newAuthData;
}

export function resolveTableData(tableData: ITableData, variables: { [key: string]: string }) {
  return Object.keys(tableData)
    .map((key) => ({ key, rows: tableData[key as OptionType] }))
    .reduce((prev, { key, rows }) => ({
      ...prev,
      [key]: rows.map((row) => ({
        ...row,
        key: resolveVariable(row.key, variables),
        value: typeof row.value === 'string' ? resolveVariable(row.value, variables) : row.value,
        valueType: key === "formData" ? (row.value instanceof ArrayBuffer ? "File" : "Text") : "",
        contentType: key === "formData" ? (row.contentType ?? "text/plain") : "",
      }))
    }), {} as ITableData);
}