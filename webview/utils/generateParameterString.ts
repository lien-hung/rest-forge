import { ITableRow } from "./type";

function generateParameterString(searchParamsData: ITableRow[]) {
  if (searchParamsData.length === 0) {
    return "";
  }

  const searchParams = searchParamsData.map((param) => {
    if (typeof param.value !== "string") {
      return;
    }

    const key = param.key.replaceAll("#", "%23").replaceAll("&", "%26");
    const value = param.value.replaceAll("#", "%23").replaceAll("&", "%26");
    return value ? `${key}=${value}` : key;
  });
  const parameterString = "?" + searchParams.join("&");
  return parameterString;
}

export default generateParameterString;