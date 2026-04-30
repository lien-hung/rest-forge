import { FormParam, HeaderDefinition, PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { forEach, isEmpty, capitalize, isFunction, includes } from '../../common/lodash';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';
import { SnippetOptions } from './type';
import { sanitize } from './util';
import { getUrlStringfromUrlObject } from './util';
import { sep } from 'path';

/**
 * Parses URLEncoded body from request
 *
 * @param {*} body URLEncoded Body
 */
function parseURLEncodedBody(body: PropertyList<QueryParam>) {
  var payload = new Array<string>(),
    bodySnippet;
  forEach(body.all(), function (data) {
    if (!data.disabled) {
      payload.push(`${encodeURIComponent(data.key)}=${encodeURIComponent(data.value)}`);
    }
  });
  bodySnippet = `var data = "${payload.join('&')}";\n`;
  return bodySnippet;
}

/**
 * Parses Raw data
 *
 * @param {*} body Raw body data
 * @param {*} trim trim body option
 * @param {String} contentType Content type of the body being sent
 * @param {String} indentString Indentation string
 */
function parseRawBody(body: string, trim: boolean, contentType: string, indentString: string) {
  var bodySnippet = 'var data = ';
  if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
    try {
      let jsonBody = JSON.parse(body);
      bodySnippet += `JSON.stringify(${JSON.stringify(jsonBody, null, indentString.length)});\n`;
    } catch (error) {
      bodySnippet += `"${sanitize(body.toString(), trim)}";\n`;
    }
  } else {
    bodySnippet += `"${sanitize(body.toString(), trim)}";\n`;
  }
  return bodySnippet;
}

/**
 * Parses formData body from request
 *
 * @param {*} body formData Body
 * @param {*} trim trim body option
 */
function parseFormData(body: PropertyList<FormParam>, trim: boolean) {
  var bodySnippet = 'var data = new FormData();\n';
  forEach(body.all(), (data) => {
    if (!(data.disabled)) {
      if (data.type === 'file') {
        var pathArray = data.src.split(sep),
          fileName = pathArray[pathArray.length - 1];
        bodySnippet += `data.append("${sanitize(data.key, trim)}", fileInput.files[0], "${fileName}");\n `;
      } else {
        bodySnippet += `data.append("${sanitize(data.key, trim)}", "${sanitize(data.value, trim)}");\n`;
      }
    }
  });
  return bodySnippet;
}

/**
 * Parses file body from the Request
 */
function parseFile() {
  var bodySnippet = 'var data = "<file contents here>";\n';
  return bodySnippet;
}

/**
 * Parses Body from the Request
 *
 * @param {*} body body object from request.
 * @param {*} trim trim body option
 * @param {String} indentString indentation to be added to the snippet
 * @param {String} contentType Content type of the body being sent
 */
function parseBody(body: RequestBody, trim: boolean, indentString: string, contentType: string) {
  if (!isEmpty(body)) {
    switch (body.mode) {
      case 'urlencoded':
        return body.urlencoded ? parseURLEncodedBody(body.urlencoded) : '';
      case 'raw':
        return parseRawBody(String(body.raw), trim, contentType, indentString);
      case 'formdata':
        return body.formdata ? parseFormData(body.formdata, trim) : '';
      case 'file':
        return parseFile();
      default:
        return 'var data = null;\n';
    }
  }
  return 'var data = null;\n';
}

/**
 * Parses headers from the request.
 *
 * @param {Object} headers headers from the request.
 */
function parseHeaders(headers: HeaderDefinition[]) {
  var headerSnippet = '';
  if (!isEmpty(headers)) {
    headers = headers.filter((header) => !header.disabled);
    forEach(headers, function (header) {
      if (capitalize(header.key) === 'Cookie') {
        headerSnippet += '// WARNING: Cookies will be stripped away by the browser before sending the request.\n';
      }
      headerSnippet += `xhr.setRequestHeader("${sanitize(header.key, true)}", "${sanitize(header.value)}");\n`;
    });
  }
  return headerSnippet;
}

/**
 * Used to get the options specific to this codegen
 *
 * @returns {Array} - Returns an array of option objects
 */
export function getOptions(): Array<any> {
  return [
    {
      name: 'Set indentation count',
      id: 'indentCount',
      type: 'positiveInteger',
      default: 2,
      description: 'Set the number of indentation characters to add per code level'
    },
    {
      name: 'Set indentation type',
      id: 'indentType',
      type: 'enum',
      availableOptions: ['Tab', 'Space'],
      default: 'Space',
      description: 'Select the character used to indent lines of code'
    },
    {
      name: 'Set request timeout',
      id: 'requestTimeout',
      type: 'positiveInteger',
      default: 0,
      description: 'Set number of milliseconds the request should wait for a response' +
        ' before timing out (use 0 for infinity)'
    },
    {
      name: 'Trim request body fields',
      id: 'trimRequestBody',
      type: 'boolean',
      default: false,
      description: 'Remove white space and additional lines that may affect the server\'s response'
    }
  ];
}

/**
 * @description Converts Postman sdk request object to nodejs(unirest) code snippet
 * @param {Object} request - postman-SDK request object
 * @param {Object} options
 * @param {String} options.indentType - type for indentation eg: Space, Tab
 * @param {String} options.indentCount - number of spaces or tabs for indentation.
 * @param {Boolean} options.trimRequestBody - whether to trim fields in request body or not
 * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
 * @param {Function} callback - callback function with parameters (error, snippet)
 */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  if (!isFunction(callback)) {
    throw new Error('JS-XHR-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());
  var indent, trim, headerSnippet,
    codeSnippet = '',
    bodySnippet = '';
  indent = options.indentType === 'Tab' ? '\t' : ' ';
  indent = indent.repeat(options.indentCount);
  trim = options.trimRequestBody;

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  bodySnippet = request.body ? parseBody(request.body, trim, indent, request.headers.get('Content-Type')) : '';

  if (includes(['Get', 'Post'], capitalize(request.method))) {
    codeSnippet += `// WARNING: For ${request.method} requests, body is set to null by browsers.\n`;
  }
  codeSnippet += bodySnippet + '\n';

  codeSnippet += 'var xhr = new XMLHttpRequest();\nxhr.withCredentials = true;\n\n';

  codeSnippet += 'xhr.addEventListener("readystatechange", function() {\n';
  codeSnippet += `${indent}if(this.readyState === 4) {\n`;
  codeSnippet += `${indent.repeat(2)}console.log(this.responseText);\n`;
  codeSnippet += `${indent}}\n});\n\n`;

  codeSnippet += `xhr.open("${request.method}", "${getUrlStringfromUrlObject(request.url)}");\n`;
  if (options.requestTimeout) {
    codeSnippet += `xhr.timeout = ${options.requestTimeout};\n`;
    codeSnippet += 'xhr.addEventListener("ontimeout", function(e) {\n';
    codeSnippet += `${indent} console.log(e);\n`;
    codeSnippet += '});\n';
  }
  if (request.body && request.body.mode === 'graphql' && !request.headers.has('Content-Type')) {
    request.addHeader({
      key: 'Content-Type',
      value: 'application/json'
    });
  }
  headerSnippet = parseHeaders(request.toJSON().header ?? []);

  codeSnippet += headerSnippet + '\n';

  codeSnippet += request.body && !isEmpty(request.body.toJSON()) ? 'xhr.send(data);' : 'xhr.send();';
  callback(null, codeSnippet);
}
