import { ITableRow } from "./type";

function generateParameterString(searchParamsData: ITableRow[]) {
  if (searchParamsData.length === 0) {
    return "";
  }

  const searchParams = searchParamsData.map((param) => {
    const key = param.key.replaceAll("&", "%26");
    const value = param.value.replaceAll("&", "%26");
    return value ? `${key}=${value}` : key;
  });
  const parameterString = "?" + searchParams.join("&");
  return parameterString;
}

export default generateParameterString;