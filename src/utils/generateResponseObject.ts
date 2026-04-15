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
    if (request.body instanceof FormData) {
      delete request.headers["Content-Type"];
    }

    const response = (request.method === "GET" || request.method === "HEAD")
      ? await fetch(request.url)
      : await fetch(
        request.url,
        {
          method: request.method,
          headers: request.headers,
          body: request.body
        }
      );

    const receivedTime = new Date().getTime();
    const totalRequestTime = receivedTime - sentTime;

    const headersArray: any[] = [];
    response.headers.forEach((value, key) => {
      headersArray.push({ key: key, value: value });
    });
    
    const contentTypeHeader = headersArray.find((header) => header.key.toLowerCase() === "content-type");
    let responseBody: string | ArrayBuffer;
    if (contentTypeHeader) {
      const textTypes = ["text", "json", "html", "xml"];
      const isTextResponse = textTypes.some((type) => contentTypeHeader.value.includes(type));
      if (isTextResponse) {
        responseBody = await response.text();
      } else {
        responseBody = await response.blob().then(blob => blob.arrayBuffer());
      }
    } else {
      responseBody = await response.text();
    }
    
    const responseBodySize = responseBody instanceof ArrayBuffer ? responseBody.byteLength : Buffer.from(responseBody).length;
    const headersSize = Buffer.from(JSON.stringify(headersArray)).length;

    const responseDataObject = {
      type: TYPE.RESPONSE,
      body: responseBody,
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
