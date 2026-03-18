import { TYPE } from "../constants";
import { IGraphqlData, IParameterKeyValueData } from "./type";

function getBody(
  keyValueData: IParameterKeyValueData[],
  bodyOption: string,
  bodyRawData: string,
  graphqlData: IGraphqlData,
) {
  if (bodyOption === "None") {
    return "";
  }

  if (bodyOption === TYPE.BODY_RAW) {
    return bodyRawData;
  }

  if (bodyOption === TYPE.BODY_GRAPHQL) {
    const graphqlBody = {
      query: graphqlData.query,
      variables: JSON.parse(graphqlData.variables),
    };
    return JSON.stringify(graphqlBody);
  }
  
  if (bodyOption === TYPE.BODY_FORM_DATA) {
    const formData = new FormData();

    const formDataArray = keyValueData.filter(
      (data) => data.optionType === TYPE.BODY_FORM_DATA && data.isChecked,
    );

    for (const { key, value } of formDataArray) {
      formData.append(key, value);
    }

    return formData;
  } else if (bodyOption === TYPE.BODY_FORM_URLENCODED) {
    const urlEncodedFormData = new URLSearchParams();

    const formDataArray = keyValueData.filter(
      (data) => data.optionType === TYPE.BODY_FORM_URLENCODED && data.isChecked,
    );

    for (const { key, value } of formDataArray) {
      if (typeof value === "string") {
        urlEncodedFormData.append(key, value);
      }
    }

    return urlEncodedFormData;
  }

  return "";
}

export default getBody;
