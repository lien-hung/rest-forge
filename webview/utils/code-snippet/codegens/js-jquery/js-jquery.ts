import { Request, RequestBody } from 'postman-collection';
import { isEmpty, isFunction } from '../../common/lodash';
import parseBody from './util/parseBody';
import { sanitize } from './util/sanitize';
import { sep } from 'path';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * Used to parse the request headers
 *
 * @param  {Object} request - postman SDK-request object
 * @param  {String} indent - used for indenting snippet's structure
 * @returns {String} - request headers in the desired format
 */
function getHeaders(request: Request, indent: string): string {
  var headerObject = request.getHeaders({ enabled: true }),
    headerMap;

  if (!isEmpty(headerObject)) {
    headerMap = Object.keys(headerObject).map((key) => {
      if (Array.isArray(headerObject[key])) {
        var headerValues = headerObject[key].map((value) => `"${sanitize(value, 'header')}"`);
        return `${indent.repeat(2)}"${sanitize(key, 'header', true)}": [${headerValues.join(', ')}]`;
      }
      return `${indent.repeat(2)}"${sanitize(key, 'header', true)}": "${sanitize(headerObject[key], 'header')}"`;
    });
    return `${indent}"headers": {\n${headerMap.join(',\n')}\n${indent}},\n`;
  }
  return '';
}

/**
 * Used to get the form-data
 *
 * @param  {Object} request - postman SDK-request object
 * @param  {Boolean} trimRequestBody - whether to trim request body fields
 * @returns {String} - form-data in the desired format
 */
function createForm(request: Request, trimRequestBody: boolean): string {
  var form = '',
    enabledFormList,
    formMap;

  form += 'var form = new FormData();\n';
  enabledFormList = request.body?.formdata?.filter((param) => !param.disabled, undefined);
  if (enabledFormList && !isEmpty(enabledFormList)) {
    formMap = enabledFormList.map((param) => {
      if ('type' in param && param.type === 'file' && 'src' in param && typeof param.src === 'string') {
        var pathArray = param.src.split(sep),
          fileName = pathArray[pathArray.length - 1];
        return `form.append("${sanitize(param.key, 'formdata', trimRequestBody)}", fileInput.files[0], "${sanitize(fileName, 'formdata', trimRequestBody)}");`;
      }
      return `form.append("${sanitize(param.key, 'formdata', trimRequestBody)}", "${sanitize(param.value, 'formdata', trimRequestBody)}");`;
    });
    form += `${formMap.join('\n')}\n\n`;
  }
  return form;
}

/**
 * Used to return options which are specific to a particular plugin
 *
 * @returns {Array}
 */
export function getOptions(): Array<any> {
  return [{
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
  }];
}

/**
  * Used to convert the postman sdk-request object in php-curl request snippet
  *
  * @param  {Object} request - postman SDK-request object
  * @param  {Object} options
  * @param  {String} options.indentType - type of indentation eg: Space / Tab (default: Space)
  * @param  {Number} options.indentCount - frequency of indent (default: 4 for indentType: Space,
                                                                  default: 1 for indentType: Tab)
  * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
                                              (default: 0 -> never bail out)
  * @param {Boolean} options.trimRequestBody : whether to trim request body fields (default: false)
  * @param  {Function} callback - function with parameters (error, snippet)
  */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  var jQueryCode = '',
    indentType = '',
    indent = '';

  if (!isFunction(callback)) {
    throw new Error('js-jQuery~convert: Callback is not a function');
  }
  options = sanitizeOptions(options, getOptions());
  indentType = (options.indentType === 'Tab') ? '\t' : ' ';

  indent = indentType.repeat(options.indentCount);

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  if (request.body && request.body.mode === 'formdata') {
    jQueryCode = createForm(request, options.trimRequestBody);
  }
  jQueryCode += 'var settings = {\n';
  jQueryCode += `${indent}"url": "${sanitize(request.url.toString(), 'url')}",\n`;
  jQueryCode += `${indent}"method": "${request.method}",\n`;
  jQueryCode += `${indent}"timeout": ${options.requestTimeout},\n`;
  if (request.body && !request.headers.has('Content-Type')) {
    if (request.body.mode === 'file') {
      request.addHeader({
        key: 'Content-Type',
        value: 'text/plain'
      });
    }
    else if (request.body.mode === 'graphql') {
      request.addHeader({
        key: 'Content-Type',
        value: 'application/json'
      });
    }
  }
  jQueryCode += `${getHeaders(request, indent)}`;
  jQueryCode += `${parseBody(request, options.trimRequestBody, indent, request.headers.get('Content-Type'))}};\n\n`;
  jQueryCode += `$.ajax(settings).done(function (response) {\n${indent}console.log(response);\n});`;

  return callback(null, jQueryCode);
}
