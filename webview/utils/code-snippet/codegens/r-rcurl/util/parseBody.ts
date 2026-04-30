import { sanitizeString } from './sanitize';
import { isEmpty } from '../../../common/lodash';
import { FormParam, PropertyList, QueryParam, RequestBody } from 'postman-collection';
import { solveMultiFile } from '../../../common/utils';
import { FormDataInfo } from '../type';

/**
 * Parses URL encoded body
 *
 * @param {Object} body body object from request.
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @returns {String} snippet of the body generation
 */
function parseURLEncodedBody(body: PropertyList<QueryParam>, indentation: string, bodyTrim: boolean): string {
  let enabledBodyList = body.filter((param) => !param.disabled, undefined),
    bodySnippet = '';
  if (!isEmpty(enabledBodyList)) {
    let bodyDataMap = enabledBodyList.map((data) => {
      return `${indentation}"${sanitizeString(data.key, bodyTrim)}" = "${sanitizeString(data.value, bodyTrim)}"`;
    });
    bodySnippet += `c(\n${bodyDataMap.join(',\n')}\n)`;
  }
  return bodySnippet;
}

/**
 * builds a single data param
 *
 * @param {Object} data data of the param.
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @returns {String} snippet of the body generation
 */
function buildFormDataParam(data: FormParam, indentation: string, bodyTrim: boolean): string {
  return `${indentation}"${sanitizeString(data.key, bodyTrim)}" = "${sanitizeString(data.value, bodyTrim)}"`;
}

/**
 * builds a data param for a file
 *
 * @param {Object} data item from the array of form data (key value).
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @param {number} index index of the current file
 * @returns {String} snippet of file uploading
 */
function buildFormDataParamFile(data: FormParam, indentation: string, bodyTrim: boolean, index: number): string {
  return `file${index} = fileUpload(\n` +
    `${indentation.repeat(1)}filename = path.expand('${sanitizeString('src' in data ? String(data.src) : '', bodyTrim)}')` +
    ')\n';
}

/**
 * builds a data param
 *
 * @param {Object} body body object from request.
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @returns {String} snippet of the body generation
 */
function parseFormData(body: PropertyList<FormParam> | undefined, indentation: string, bodyTrim: boolean): FormDataInfo {
  let enabledBodyList = body?.filter((param) => !param.disabled, undefined),
    numberOfFiles = 0,
    bodySnippet = '',
    fileSnippet = '';
  if (enabledBodyList && !isEmpty(enabledBodyList)) {
    let formDataFile, formData, bodyDataMap;
    formDataFile = enabledBodyList.filter((param) => 'type' in param && param.type === 'file');
    formData = enabledBodyList.filter((param) => 'type' in param && param.type !== 'file');
    bodyDataMap = formData.map((data) => buildFormDataParam(data, indentation, bodyTrim));
    numberOfFiles = formDataFile.length;
    formDataFile.forEach((data, index) => fileSnippet += buildFormDataParamFile(data, indentation, bodyTrim, index));
    if (bodyDataMap.length > 0) {
      bodySnippet += `c(\n${bodyDataMap.join(',\n')}\n)`;
    }
  }
  return { bodySnippet, fileSnippet, numberOfFiles };
}

/**
 * Parses Raw data
 *
 * @param {Object} body body object from request.
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @param {String} contentType Content type of the body being sent
 * @returns {String} snippet of the body generation
 */
function parseRawBody(body: string, indentation: string, bodyTrim: boolean, contentType: string): string {
  let bodySnippet = '';
  if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
    try {
      let jsonBody = JSON.parse(body);
      bodySnippet += `"${sanitizeString(JSON.stringify(jsonBody, null, indentation.length), bodyTrim)}"`;
    }
    catch (error) {
      bodySnippet += `"${sanitizeString(body.toString(), bodyTrim)}"`;
    }
  }
  else {
    bodySnippet += JSON.stringify(body.toString());
  }
  return bodySnippet;
}

/**
 * Parses Body of file
 *
 * @return {String} the data for a binary file
 */
function parseFromFile(): string {
  return '"<file contents here>";';
}


/**
 * Parses Body from the Request
 *
 * @param {Object} body body object from request.
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @param {String} contentType Content type of the body being sent
 */
function processBodyModes(body: RequestBody, indentation: string, bodyTrim: boolean, contentType: string) {
  let bodySnippet = '';
  switch (body.mode) {
    case 'urlencoded': {
      bodySnippet = body.urlencoded ? parseURLEncodedBody(body.urlencoded, indentation, bodyTrim) : '';
      return bodySnippet === '' ? '' : `params = ${bodySnippet}\n`;
    }
    case 'raw': {
      bodySnippet = parseRawBody(String(body.raw), indentation, bodyTrim, contentType);
      return bodySnippet === '' ? '' : `params = ${bodySnippet}\n`;
    }
    case 'formdata': {
      let formData = parseFormData(body.formdata, indentation, bodyTrim),
        formParamsSnippet = formData.bodySnippet === '' ? '' : `params = ${formData.bodySnippet}\n`;
      return {
        bodySnippet: formParamsSnippet,
        fileSnippet: formData.fileSnippet,
        numberOfFiles: formData.numberOfFiles
      };
    }
    case 'file': {
      bodySnippet = parseFromFile();
      return bodySnippet === '' ? '' : `params = ${bodySnippet}\n`;
    }
    default: {
      bodySnippet = parseRawBody(String(body.raw), indentation, bodyTrim, contentType);
      return bodySnippet === '' ? '' : `params = ${bodySnippet}\n`;
    }
  }
}

/**
* parses a body to the corresponding snippet
*
* @param {object} body - postman request body
* @param {string} indentation - indentation character
* @param {boolean} bodyTrim trim body option
* @param {String} contentType Content type of the body being sent
* @returns {String/Object} snippet of the body generation or object for files information
*/
export function parseBody(body: RequestBody, indentation: string, bodyTrim: boolean, contentType: string): string | FormDataInfo {
  let snippet = '';
  if (body && !isEmpty(body)) {
    body = solveMultiFile(body);
    return processBodyModes(body, indentation, bodyTrim, contentType);
  }
  return snippet;
}