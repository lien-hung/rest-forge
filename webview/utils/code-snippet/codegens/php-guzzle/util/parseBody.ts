import { sanitizeString } from './sanitize';
import { isEmpty } from '../../../common/lodash';
import { FormParam, PropertyList, QueryParam, RequestBody } from 'postman-collection';
import { solveMultiFile } from '../../../common/utils';

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
      bodySnippet += `'${JSON.stringify(jsonBody, null, indentation.length)}';`;
    }
    catch (error) {
      bodySnippet += `'${sanitizeString(body.toString(), bodyTrim)}';`;
    }
  }
  else {
    bodySnippet += `'${sanitizeString(body.toString(), bodyTrim)}';`;
  }
  return bodySnippet;
}

/**
 * Parses URL encoded body
 *
 * @param {Object} body body object from request.
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @returns {String} snippet of the body generation
 */
function parseURLEncodedBody(body: PropertyList<QueryParam>, indentation: string, bodyTrim: boolean): string {
  let enabledBodyList = body.filter((data) => !data.disabled, undefined),
    bodySnippet = '';
  if (!isEmpty(enabledBodyList)) {
    let bodyDataMap = enabledBodyList.map((data) => {
      return `${indentation}'${sanitizeString(data.key, bodyTrim)}' => '${sanitizeString(data.value, bodyTrim)}'`;
    });
    bodySnippet += `[\n'form_params' => [\n${bodyDataMap.join(',\n')}\n]];`;
  }
  return bodySnippet;
}

/**
 *  Takes in a key value form data and creates the PHP guzzle structure
 *
 * @param {Object} data item from the array of form data (key value).
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @returns {String} snippet of the body generation
 */
function buildFormDataParam(data: FormParam, indentation: string, bodyTrim: boolean): string {
  let name = `${indentation.repeat(2)}[\n${indentation.repeat(3)}` +
    `'name' => '${sanitizeString(data.key, bodyTrim)}',\n` +
    `${indentation.repeat(3)}'contents' => '${sanitizeString(data.value, bodyTrim)}'\n` +
    `${indentation.repeat(2)}]`;
  return name;
}

/**
 *  Gets the content file of the param
 *
 * @param {Object} data item from the array of form data (key value).
 * @returns {String} snippet of the content
 */
function getContentFileFormData(data: FormParam): string {
  if (!data.value && 'src' in data) {
    return `Utils::tryFopen('${data.src}', 'r')`;
  }
  return `'${sanitizeString(data.value)}'`;
}

/**
 * Takes in a key value form data and creates the PHP guzzle structure
 * for files
 *
 * @param {Object} data item from the array of form data (key value).
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @returns {String} snippet of the body generation
 */
function buildFormDataParamFile(data: FormParam, indentation: string, bodyTrim: boolean): string {
  let name = `${indentation.repeat(2)}[\n${indentation.repeat(3)}` +
    `'name' => '${sanitizeString(data.key, bodyTrim)}',\n` +
    `${indentation.repeat(3)}'contents' => ${getContentFileFormData(data)},\n` +
    `${indentation.repeat(3)}'filename' => '${sanitizeString('src' in data ? String(data.src) : '', bodyTrim)}',\n` +
    `${indentation.repeat(3)}'headers'  => [\n` +
    `${indentation.repeat(4)}'Content-Type' => '<Content-type header>'\n${indentation.repeat(3)}]\n` +
    `${indentation.repeat(2)}]`;
  return name;
}


/**
 * Parses form data
 *
 * @param {Object} body body object from request.
 * @param {String} indentation indentation to be added to the snippet
 * @param {boolean} bodyTrim trim body option
 * @returns {String} snippet of the body generation
 */
function parseFormData(body: PropertyList<FormParam>, indentation: string, bodyTrim: boolean): string {
  let enabledBodyList = body.filter((data) => !data.disabled, undefined),
    bodySnippet = '';
  if (!isEmpty(enabledBodyList)) {
    let bodyDataMap = enabledBodyList.map((data) => {
      if ('type' in data && data.type === 'file') {
        return buildFormDataParamFile(data, indentation, bodyTrim);
      }
      return buildFormDataParam(data, indentation, bodyTrim);
    });
    bodySnippet += `[\n${indentation}'multipart' => [\n${bodyDataMap.join(',\n')}\n]];`;
  }
  return bodySnippet;
}

/**
 * Parses Body of file
 *
 * @return {String} the data for a binary file
 */
function parseFromFile(): string {
  return '\'<file contents here>\';';
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
      return bodySnippet === '' ? '' : `$options = ${bodySnippet}\n`;
    }
    case 'raw': {
      bodySnippet = parseRawBody(String(body.raw), indentation, bodyTrim, contentType);
      return bodySnippet === '' ? '' : `$body = ${bodySnippet}\n`;
    }
    case 'formdata': {
      bodySnippet = body.formdata ? parseFormData(body.formdata, indentation, bodyTrim) : '';
      return bodySnippet === '' ? '' : `$options = ${bodySnippet}\n`;
    }
    case 'file': {
      bodySnippet = parseFromFile();
      return bodySnippet === '' ? '' : `$body = ${bodySnippet}\n`;
    }
    default: {
      bodySnippet = parseRawBody(String(body.raw), indentation, bodyTrim, contentType);
      return bodySnippet === '' ? '' : `$body = ${bodySnippet}\n`;
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
* @returns {String} snippet of the body generation
*/
function parseBody(body: RequestBody, indentation: string, bodyTrim: boolean, contentType: string): string {
  let snippet = '';
  if (body && !isEmpty(body)) {
    body = solveMultiFile(body);
    return processBodyModes(body, indentation, bodyTrim, contentType);
  }
  return snippet;
}

export default parseBody;
