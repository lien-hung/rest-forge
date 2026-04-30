import { PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { isEmpty } from '../../common/lodash';
import { sanitize } from './util';
import { sep } from 'path';

/**
 * parses body of request when type of the request body is formdata or urlencoded and
 * returns code snippet for nodejs to add body
 *
 * @param {Array<Object>} dataArray - array containing body elements of request
 * @param {String} indentString - string required for indentation
 * @param {Boolean} trimBody - indicates whether to trim body or not
 */
function extractFormData(dataArray: PropertyList<QueryParam>, indentString: string, trimBody: boolean) {
  if (!dataArray) {
    return '';
  }

  const snippetString = dataArray
    .filter((item) => !item.disabled, undefined)
    .map((item) => indentString + `'${sanitize(item.key, trimBody)}': '${sanitize(item.value, trimBody)}'`);
  return snippetString.join(',\n');
}

/**
 * Generates multipart form data snippet
 *
 * @param {*} requestBody
 */
function generateMultipartFormData(requestBody: RequestBody) {
  const boundary = '------WebKitFormBoundary7MA4YWxkTrZu0gW\\r\\nContent-Disposition: form-data; ',
    dataArray = requestBody.formdata?.all();
  var postData = '';

  if (dataArray && dataArray.length) {
    postData = '"' + boundary + dataArray.map((item) => {
      const key = item.key.replace(/"/g, '\'');

      if ('type' in item && item.type === 'file' && 'src' in item && typeof item.src === 'string') {
        var pathArray = item.src.split(sep),
          fileName = pathArray[pathArray.length - 1];
        const filename = `filename=\\"${fileName}\\"`,
          contentType = 'Content-Type: \\"{Insert_File_Content_Type}\\"',
          fileContent = `fs.readFileSync('${item.src}')`;

        return `name=\\"${key}\\"; ${filename}\\r\\n${contentType}\\r\\n\\r\\n" + ${fileContent} + "\\r\\n`;
      } else {
        const value = item.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        let field = `name=\\"${key}\\"\\r\\n`;
        if ('contentType' in item) {
          field += `Content-Type: ${item.contentType}\\r\\n`;
        }
        field += `\\r\\n${value}\\r\\n`;
        return field;
      }
    }).join(`${boundary}`) + '------WebKitFormBoundary7MA4YWxkTrZu0gW--\"';
  }

  return postData;
}

/**
 * Parses body object based on mode of body and returns code snippet
 *
 * @param {Object} requestBody - json object for body of request
 * @param {String} indentString - string for indentation
 * @param {Boolean} trimBody - indicates whether to trim body fields or not
 * @param {String} contentType Content type of the body being sent
 */
export function parseBody(requestBody: RequestBody, indentString: string, trimBody: boolean, contentType: string) {
  if (requestBody) {
    switch (requestBody.mode) {
      case 'raw':
        if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
          try {
            let jsonBody = JSON.parse(String(requestBody.raw));
            return `JSON.stringify(${JSON.stringify(jsonBody, null, indentString.length)})`;
          }
          catch (error) {
            return ` ${JSON.stringify(requestBody.raw)}`;
          }
        }
        return ` ${JSON.stringify(requestBody.raw)}`;
      case 'formdata':
        return generateMultipartFormData(requestBody);
      case 'urlencoded':
        return requestBody.urlencoded ? `qs.stringify({\n${extractFormData(requestBody.urlencoded, indentString, trimBody)}\n})` : '';
      case 'file':
        return '"<file contents here>"';
      default:
        return '';
    }
  }
  return '';
}

/**
 * parses header of request object and returns code snippet of nodejs native to add header
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required in code snippet
 * @returns {String} - code snippet of nodejs native to add header
 */
export function parseHeader(request: Request, indentString: string): string {
  var headerObject = request.getHeaders({ enabled: true }),
    headerSnippet = indentString + '\'headers\': {\n';

  if (headerObject) {
    const headerArray = new Array<string>();
    Object.keys(headerObject).forEach((key) => {
      if (Array.isArray(headerObject[key])) {
        const headerValues = headerObject[key].map((value) => `'${sanitize(value)}'`);
        headerArray.push(indentString.repeat(2) + `'${sanitize(key, true)}': [${headerValues.join(', ')}]`);
      } else {
        headerArray.push(indentString.repeat(2) + `'${sanitize(key, true)}': '${sanitize(headerObject[key])}'`);
      }
    });
    headerSnippet += headerArray.join(',\n');
  }

  if (headerObject && !isEmpty(headerObject)) {
    headerSnippet += '\n';
  }

  headerSnippet += indentString + '}';
  return headerSnippet;
}
