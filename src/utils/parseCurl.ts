import { XMLValidator } from "fast-xml-parser";
import parser from "yargs-parser";

import { ITableRow, IRequestObject } from "./type";
import { TYPE } from "../constants";

const emptyTableRow = () =>
  ({ id: crypto.randomUUID(), isChecked: false, key: "", value: "", rowReadOnly: false });

const newTableRow = ({ key, value, rowReadOnly = false }: { key: string, value: string, rowReadOnly?: boolean }) =>
  ({ id: crypto.randomUUID(), isChecked: true, key, value, rowReadOnly });

function parseCurl(command: string) {
  if (!command.trim()) {
    return;
  }

  command = command.trim();

  if (!command.toLowerCase().startsWith("curl ")) {
    return;
  }

  command = command.replace(/^\s+|\s+$/gm, "");
  command = command.replace(/(\r\n|\n|\r)/gm, " ");

  const argvs = parser(command);

  const request: IRequestObject = {
    requestMethod: "GET",
    requestUrl: "",
    authOption: TYPE.NO_AUTH,
    authData: { username: "", password: "", token: "", tokenPrefix: "Bearer" },
    oauth2Data: { token: "", prefix: "Bearer", tokenType: "Access token", addTo: "Headers" },
    bodyOption: "None",
    bodyRawOption: "Text",
    bodyRawData: { text: "", javascript: "", json: "", html: "", xml: "" },
    tableData: { "Params": [], "Headers": [], "Form Data": [], "Form Encoded": [] }
  };

  const isJson = (str: string) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  const removeQuotes = (str: string) => str.trim().replace(/[""]+/g, "").replace(/['']+/g, "");

  const isUrl = (str: string) => /(?:^|[ \t])((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/.test(str);

  const parseField = (str: string) => str.split(/: (.+)/);

  const parseHeader = (header: string | string[]) => {
    if (Array.isArray(header)) {
      header.forEach(item => addHeader(item));
    } else {
      addHeader(header);
    }
  };

  const addHeader = (item: string) => {
    const field = parseField(item);
    if (!isAuthHeader(field)) {
      request.tableData["Headers"].push(newTableRow({ key: field[0], value: field[1] }));
    }
  };

  const isAuthHeader = (field: string[]) => {
    if (field[0].toLowerCase() === "authorization" && field[1].toLowerCase().includes("bearer ")) {
      request.authOption = TYPE.BEARER_TOKEN;
      request.authData = {
        ...request.authData,
        token: field[1].replace("Bearer ", "").replace("bearer ", ""),
        tokenPrefix: "Bearer"
      };
      return true;
    }
    return false;
  };

  const parseData = (data: any) => {
    const contentTypeHeader = request.tableData["Headers"].find(d => d.key.toLowerCase() === "content-type")?.value;
    if (typeof contentTypeHeader !== "string") {
      return;
    }
    
    if (contentTypeHeader?.includes("application/x-www-form-urlencoded")) {
      request.bodyOption = TYPE.BODY_FORM_URLENCODED;
      request.tableData["Form Encoded"].push(...parseDataUrlEncode(data));
    } else {
      request.bodyOption = TYPE.BODY_RAW;
      if (contentTypeHeader?.includes("application/json") || isJson(data)) {
        request.bodyRawOption = "JSON";
        request.bodyRawData.json = data;
      } else if (contentTypeHeader?.includes("application/xml") || XMLValidator.validate(data)) {
        request.bodyRawOption = "XML";
        request.bodyRawData.xml = data;
      } else if (contentTypeHeader?.includes("text/html")) {
        request.bodyRawOption = "HTML";
        request.bodyRawData.html = data;
      } else {
        request.bodyRawOption = "Text";
        request.bodyRawData.text = data;
      }
    }
  };

  const parseDataUrlEncode = (data: string | string[]) => {
    const contentTypeHeader = request.tableData["Headers"].find(d => d.key.toLowerCase() === "content-type")?.value;

    if (!contentTypeHeader) {
      request.tableData["Headers"].push(newTableRow({
        key: "Content-Type",
        value: "application/x-www-form-urlencoded",
        rowReadOnly: true
      }));
    }

    if (Array.isArray(data)) {
      const dataUrlEncoded = data.map(d => encodeURI(d)).join("&");
      return generateFormUrlEncoded(dataUrlEncoded);
    } else {
      return generateFormUrlEncoded(data);
    }
  };

  const generateFormUrlEncoded = (data: string) => {
    const searchParams = new URLSearchParams(data);
    const params: ITableRow[] = [];
    for (const p of searchParams) {
      if (p[0] && p[0].trim()) {
        const tableRow = newTableRow({ key: p[0].trim(), value: p[1].trim() });
        params.push(tableRow);
      }
    }
    return params;
  };

  const setRequestMethod = () => {
    if (request.requestMethod === "GET" || request.requestMethod === "OPTIONS" || request.requestMethod === "HEAD") {
      request.requestMethod = "POST";
    }
  };

  for (const argv in argvs) {
    switch (argv) {
      case "_":
        argvs[argv].forEach(item => {
          item = removeQuotes(item.toString());
          if (isUrl(item)) {
            request.requestUrl = item;
          }
        });
        break;

      case "X":
      case "request":
        request.requestMethod = argvs[argv].toString();
        break;

      case "H":
      case "header":
        parseHeader(argvs[argv]);
        break;

      case "u":
      case "user":
        const loginData = argvs[argv].split(":");
        request.authOption = TYPE.BASIC_AUTH;
        request.authData = {
          ...request.authData,
          username: loginData[0],
          password: loginData[1]
        };
        break;

      case "A":
      case "user-agent":
        request.tableData["Headers"].push(newTableRow({ key: "user-agent", value: argvs[argv] }));
        break;

      case "I":
      case "head":
        request.requestMethod = "HEAD";
        break;

      case "b":
      case "cookie":
        request.tableData["Headers"].push(newTableRow({ key: "Set-Cookie", value: argvs[argv] }));
        break;

      case "d":
      case "data":
      case "data-raw":
      case "data-ascii":
        parseData(argvs[argv]);
        setRequestMethod();
        break;

      case "data-urlencode":
        request.bodyOption = TYPE.BODY_FORM_URLENCODED;
        request.tableData["Form Encoded"].push(...parseDataUrlEncode(argvs[argv]));
        setRequestMethod();
        break;

      case "compressed":
        const index = request.tableData["Headers"].findIndex(d => d.key.toLowerCase() === "accept-encoding");
        if (index === -1) {
          request.tableData["Headers"].push(newTableRow({
            key: "Accept-Encoding",
            value: (!argvs[argv] || typeof argvs[argv] === "boolean") ? "gzip, deflate" : argvs[argv],
          }));
        }
        break;

      default:
        break;
    }
  }

  for (const optionType in request.tableData) {
    // @ts-expect-error
    request.tableData[optionType].push(emptyTableRow());
  }

  return request;
}

export default parseCurl;