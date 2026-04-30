import { Request, RequestBody } from 'postman-collection';
import { isFunction } from '../../common/lodash';
import parseBody from './util/parseBody';
import { sanitize } from './util/sanitize';
import { getUrlStringfromUrlObject } from './util/sanitize';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * Used to parse the request headers
 *
 * @param  {Object} request - postman SDK-request object
 * @param  {String} indentation - used for indenting snippet's structure
 * @returns {String} - request headers in the desired format
 */
function getHeaders(request: Request, indentation: string): string {
  var headerArray = request.toJSON().header,
    headerMap;

  if (headerArray) {
    headerArray = headerArray.filter((header) => !header.disabled);
    headerMap = headerArray.map(function (header) {
      return `${indentation.repeat(2)}'${sanitize(header.key, 'header', true)}: ` +
        `${sanitize(header.value, 'header')}'`;
    });
    return `${indentation}CURLOPT_HTTPHEADER => array(\n${headerMap.join(',\n')}\n${indentation}),\n`;
  }
  return '';
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
    name: 'Follow redirects',
    id: 'followRedirect',
    type: 'boolean',
    default: true,
    description: 'Automatically follow HTTP redirects'
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
  * @param {Boolean} options.followRedirect : whether to allow redirects of a request
  * @param  {Function} callback - function with parameters (error, snippet)
  */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  var snippet = '',
    indentation = '',
    identity = '',
    finalUrl;

  if (!isFunction(callback)) {
    throw new Error('Php-Curl~convert: Callback is not a function');
  }
  options = sanitizeOptions(options, getOptions());

  identity = options.indentType === 'Tab' ? '\t' : ' ';
  indentation = identity.repeat(options.indentCount);
  // concatenation and making up the final string
  finalUrl = getUrlStringfromUrlObject(request.url);
  snippet = '<?php\n\n$curl = curl_init();\n\n';
  snippet += 'curl_setopt_array($curl, array(\n';
  snippet += `${indentation}CURLOPT_URL => '${sanitize(finalUrl, 'url')}',\n`;
  snippet += `${indentation}CURLOPT_RETURNTRANSFER => true,\n`;
  snippet += `${indentation}CURLOPT_ENCODING => '',\n`;
  snippet += `${indentation}CURLOPT_MAXREDIRS => 10,\n`;
  snippet += `${indentation}CURLOPT_TIMEOUT => ${options.requestTimeout},\n`;
  snippet += `${indentation}CURLOPT_FOLLOWLOCATION => ${options.followRedirect},\n`;
  snippet += `${indentation}CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,\n`;
  snippet += `${indentation}CURLOPT_CUSTOMREQUEST => '${request.method}',\n`;

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  snippet += `${parseBody(request, options.trimRequestBody, indentation)}`;
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
  snippet += `${getHeaders(request, indentation)}`;
  snippet += '));\n\n';
  snippet += '$response = curl_exec($curl);\n\n';
  snippet += 'curl_close($curl);\n';
  snippet += 'echo $response;\n';

  return callback(null, snippet);
}