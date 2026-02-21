import { MESSAGE, TYPE } from "../constants";
import { IRequestData } from "./type";

async function generateResponseObject(
  request: IRequestData | undefined,
) {
  if (!request) {
    return;
  }

  const sentTime = new Date().getTime();

  try {
    // The "Content-Type" header is set automatically if form data is submitted
    if (request.data instanceof FormData) {
      delete request.headers["Content-Type"];
    }

    const response = (request.method === "GET" || request.method === "HEAD")
      ? await fetch(request.url)
      : await fetch(
        request.url,
        {
          method: request.method,
          headers: request.headers,
          body: request.data
        }
      );

    const receivedTime = new Date().getTime();
    const totalRequestTime = receivedTime - sentTime;

    const headersArray: any[] = [];
    response.headers.forEach((value, key) => {
      headersArray.push({ key: key, value: value });
    });
    const responseBody = await response.text();
    
    const responseBodySize = Buffer.from(responseBody).length;
    const headersSize = Buffer.from(JSON.stringify(headersArray)).length;

    const responseDataObject = {
      type: TYPE.RESPONSE,
      data: responseBody,
      headers: headersArray,
      headersLength: headersArray.length,
      statusCode: response.status,
      statusText: response.statusText,
      requestTime: totalRequestTime,
      responseSize: responseBodySize + headersSize,
    };

    return responseDataObject;
  } catch (error: any) {
    return {
      type: MESSAGE.ERROR,
      message: error.message,
    };
  }
}

export default generateResponseObject;
