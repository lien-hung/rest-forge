import { Request, RequestBody } from 'postman-collection';
import { isEmpty } from '../../common/lodash';
import { sanitize } from './util';
import { sep } from 'path';

/**
 * parses body of request and returns urlencoded string
 *
 * @param {Object} requestBody - json object respresenting body of request
 * @param {Boolean} trimFields - indicates whether to trim fields of body
 * @returns {String} - urlencoded string for request body
 */
function parseUrlencode(requestBody: RequestBody, trimFields: boolean): string {
  if (!requestBody.urlencoded) {
    return '';
  }

  return requestBody.urlencoded
    .filter((param) => !param.disabled, undefined)
    .map((param) => `${sanitize(param.key, trimFields)}=${sanitize(param.value, trimFields)}`.replace(/&/g, '%26'))
    .join('&');
}

/**
 * parses body of request and creates java okhttp code snippet for adding form data
 *
 * @param {Object} requestBody - JSON object representing body of request
 * @param {String} indentString - string for indentation
 * @param {Boolean} trimFields - indicates whether to trim fields of body
 * @returns {String} - code snippet of java okhttp for multipart formdata
 */
function parseFormData(requestBody: RequestBody, indentString: string, trimFields: boolean): string {
  let body = '';
  requestBody.formdata?.each((data) => {
    if (data.disabled) {
      return;
    }
    if ('type' in data && data.type === 'file' && 'src' in data && typeof data.src === 'string') {
      var pathArray = data.src.split(sep),
        fileName = pathArray[pathArray.length - 1];
      body += indentString + '.addFormDataPart' +
        `("${sanitize(data.key, trimFields)}","${sanitize(fileName, trimFields)}",\n` +
        indentString.repeat(2) + `File("${sanitize(data.src)}")` +
        '.asRequestBody("application/octet-stream".toMediaType()))\n';
    } else {
      !data.value && (data.value = '');
      body += `${indentString}.addFormDataPart("${sanitize(data.key, trimFields)}",`;
      if ('contentType' in data) {
        body += ` null,\n${indentString.repeat(2)}`;
        body += ` "${sanitize(data.value, trimFields)}".toRequestBody("${data.contentType}".toMediaType()))\n`;
      } else {
        body += `"${sanitize(data.value, trimFields)}")\n`;
      }
    }
  });
  return body + indentString + '.build()';
}

/**
 * Parses request object and returns kotlin okhttp code snippet for raw body
 *
 * @param {Object} requestBody - JSON object representing body of request
 * @param {Boolean} trimFields - indicates whether to trim fields of body
 * @param {String} contentType - content type of request body
 */
function parseRawBody(requestBody: RequestBody, trimFields: boolean, contentType: string) {
  if (contentType && contentType.startsWith('application/json')) {
    return `val body = ${JSON.stringify(requestBody.raw)}.toRequestBody(mediaType)\n`;
  }

  return `val body = "${sanitize(requestBody.raw, trimFields)}".toRequestBody(mediaType)\n`;
}

/**
 * parses request object and returns java okhttp code snippet for adding request body
 *
 * @param {Object} requestBody - JSON object representing body of request
 * @param {String} indentString - string for indentation
 * @param {Boolean} trimFields - indicates whether to trim fields of body
 * @param {String} contentType - content type of request body
 *
 * @returns {String} - code snippet of java okhttp parsed from request object
 */
export function parseBody(requestBody: RequestBody, indentString: string, trimFields: boolean, contentType: string): string {
  if (!isEmpty(requestBody)) {
    switch (requestBody.mode) {
      case 'urlencoded':
        return `val body = "${parseUrlencode(requestBody, trimFields)}".toRequestBody(mediaType)\n`;
      case 'raw':
        return parseRawBody(requestBody, trimFields, contentType);
      case 'formdata':
        return requestBody.formdata?.count() ?
          'val body = MultipartBody.Builder().setType(MultipartBody.FORM)\n' +
          `${parseFormData(requestBody, indentString, trimFields)}\n` :
          'val body = "{}".toRequestBody("application/json; charset=utf-8".toMediaType())\n';
      case 'file':
        return `val body = File("${requestBody.file?.src}")` +
          '.asRequestBody("application/octet-stream".toMediaType())\n';
      default:
        return 'val body = "".toRequestBody(mediaType)\n';
    }
  }
  return 'val body = "".toRequestBody(mediaType)\n';
}

/**
 * Parses header in Postman-SDK request and returns code snippet of java okhttp for adding headers
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation for code snippet
 * @returns {String} - code snippet for adding headers in kotlin-okhttp
 */
export function parseHeader(request: Request, indentString: string): string {
  var headerArray = request.toJSON().header,
    headerSnippet = '';

  if (headerArray && !isEmpty(headerArray)) {
    headerArray = headerArray.filter((header) => !header.disabled);
    headerSnippet += headerArray.map((header) => indentString + `.addHeader("${sanitize(header.key, true)}", "${sanitize(header.value)}")\n`).join('');
  }
  return headerSnippet;
}

/**
 * returns content-type of request body if available else returns text/plain as default
 *
 * @param {Object} request - Postman SDK request object
 * @returns {String}- content-type of request body
 */
export function parseContentType(request: Request): string {
  if (request.body && request.body.mode === 'graphql') {
    return 'application/json';
  }
  return request.getHeaders({ enabled: true, ignoreCase: true })['content-type'] || 'text/plain';
}
