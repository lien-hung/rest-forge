import { FormParam, PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { forEach, isEmpty } from '../../common/lodash';
import { sanitize } from './util';

/**
 * Parses URLEncoded body from request to axios syntax
 *
 * @param {Object} body URLEncoded Body
 * @param {boolean} trim trim body option
 * @param {string} indentString The indentation string
 */
function parseURLEncodedBody(body: PropertyList<QueryParam>, trim: boolean, indentString: string) {
  let bodySnippet = 'const qs = require(\'qs\');\n',
    dataArray = new Array<string>();

  body.each((data) => {
    if (!data.disabled) {
      dataArray.push(`'${sanitize(data.key, trim)}': '${sanitize(data.value, trim)}'`);
    }
  });
  bodySnippet += `let data = qs.stringify({\n${indentString}${dataArray.join(',\n' + indentString)} \n});\n`;
  return bodySnippet;
}

/**
 * Parses Formdata from request to axios syntax
 *
 * @param {Object} body FormData body
 * @param {boolean} trim trim body option
 */
function parseFormData(body: PropertyList<FormParam>, trim: boolean) {
  let bodySnippet = 'const FormData = require(\'form-data\');\n';
  const fileArray = body.all().filter((item) => !item.disabled && 'type' in item && item.type === 'file');
  if (fileArray.length > 0) {
    bodySnippet += 'const fs = require(\'fs\');\n';
  }
  bodySnippet += 'let data = new FormData();\n';

  forEach(body.all(), function (data) {
    if (!data.disabled) {
      if (data.type === 'file') {
        const fileContent = `fs.createReadStream('${data.src}')`;
        bodySnippet += `data.append('${sanitize(data.key, trim)}', ${fileContent});\n`;
      }
      else {
        bodySnippet += `data.append('${sanitize(data.key, trim)}', '${sanitize(data.value, trim)}'`;
        if (data.contentType) {
          bodySnippet += `, {contentType: '${sanitize(data.contentType, trim)}'}`;
        }
        bodySnippet += ');\n';
      }
    }
  });
  return bodySnippet;
}

/**
 * Parses Raw data to axios syntax
 *
 * @param {Object} body Raw body data
 * @param {boolean} trim trim body option
 * @param {String} contentType Content type of the body being sent
 * @param {String} indentString Indentation string
 */
function parseRawBody(body: string, trim: boolean, contentType: string, indentString?: string) {
  let bodySnippet = 'let data = ';
  if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
    try {
      let jsonBody = JSON.parse(body);
      bodySnippet += `JSON.stringify(${JSON.stringify(jsonBody, null, indentString?.length)});\n`;
    }
    catch (error) {
      bodySnippet += `'${sanitize(body.toString(), trim)}';\n`;
    }
  }
  else {
    bodySnippet += `'${sanitize(body.toString(), trim)}';\n`;
  }
  return bodySnippet;
}

/**
 * parses binary file data
 */
function parseFileData() {
  const bodySnippet = 'let data = \'<file contents here>\';\n';
  return bodySnippet;
}

/**
 * Parses Body from the Request
 *
 * @param {Object} body body object from request.
 * @param {boolean} trim trim body option
 * @param {String} indentString indentation to be added to the snippet
 * @param {String} contentType Content type of the body being sent
 */
export function parseBody(body: RequestBody, trim: boolean, indentString: string, contentType: string) {
  if (body && !isEmpty(body)) {
    switch (body.mode) {
      case 'urlencoded':
        return body.urlencoded ? parseURLEncodedBody(body.urlencoded, trim, indentString) : '';
      case 'raw':
        return parseRawBody(String(body.raw), trim, contentType, indentString);
      case 'formdata':
        return body.formdata ? parseFormData(body.formdata, trim) : '';
      case 'file':
        return parseFileData();
      default:
        return '';
    }
  }
  return '';
}


/**
 * parses header of request object and returns code snippet of nodejs axios to add headers
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required in code snippet
 * @returns {String} - code snippet of nodejs request to add header
 */
export function parseHeader(request: Request, indentString: string): string[] {
  let headerObject = request.getHeaders({ enabled: true }),
    headerArray = new Array<string>();

  if (!isEmpty(headerObject)) {
    Object.keys(headerObject).forEach((key) => {
      if (Array.isArray(headerObject[key])) {
        const headerValues = headerObject[key].map((value) => `${sanitize(value)}`);
        headerArray.push(indentString.repeat(2) + `'${sanitize(key, true)}': '${headerValues.join(', ')}'`);
      } else {
        headerArray.push(indentString.repeat(2) + `'${sanitize(key, true)}': '${sanitize(headerObject[key])}'`);
      }
    });
  }

  return headerArray;
}
