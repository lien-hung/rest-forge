import { isFunction } from '../../common/lodash';
import { sanitize } from './util';
import { parseHeader, parseBody } from './parseRequest';
import { Request, RequestBody } from 'postman-collection';
import { SnippetOptions } from './type';
import { PostgenOption } from '../../common/type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * returns snippet of nodejs(unirest) by parsing data from Postman-SDK request object
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required for code snippet
 * @param {Object} options
 * @returns {String} - nodejs(unirest) code snippet for given request object
 */
function makeSnippet(request: Request, indentString: string, options: SnippetOptions): string {
  var snippet;
  if (options.ES6_enabled) {
    snippet = 'const ';
  }
  else {
    snippet = 'var ';
  }
  snippet += 'unirest = require(\'unirest\');\n';
  if (options.ES6_enabled) {
    snippet += 'const ';
  }
  else {
    snippet += 'var ';
  }
  snippet += `req = unirest('${request.method}', '${sanitize(request.url.toString())}')\n`;
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

  snippet += parseHeader(request, indentString);

  request.body = solveMultiFile(request.body ?? <RequestBody>{});  
  if (request.body) {
    snippet += parseBody(request.body, indentString, options.trimRequestBody, request.headers.get('Content-Type'));
  }
  if (options.requestTimeout) {
    snippet += indentString + `.timeout(${options.requestTimeout})\n`;
  }
  if (options.followRedirect === false) {
    snippet += indentString + '.followRedirect(false)\n';
  }
  if (options.ES6_enabled) {
    snippet += indentString + '.end((res) => { \n';
  }
  else {
    snippet += indentString + '.end(function (res) { \n';
  }
  snippet += indentString.repeat(2) + 'if (res.error) throw new Error(res.error); \n';
  snippet += indentString.repeat(2) + 'console.log(res.raw_body);\n';
  snippet += indentString + '});\n';

  return snippet;
}

/**
 * Used to get the options specific to this codegen
 *
 * @returns {Array} - Returns an array of option objects
 */
function getOptions(): Array<PostgenOption> {
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
    },
    {
      name: 'Enable ES6 features',
      id: 'ES6_enabled',
      type: 'boolean',
      default: false,
      description: 'Modifies code snippet to incorporate ES6 (EcmaScript) features'
    }
  ];
}

/**
 * Converts Postman sdk request object to nodejs(unirest) code snippet
 *
 * @param {Object} request - postman-SDK request object
 * @param {Object} options
 * @param {String} options.indentType - type for indentation eg: Space, Tab
 * @param {String} options.indentCount - number of spaces or tabs for indentation.
 * @param {Boolean} options.followRedirect - whether to enable followredirect
 * @param {Boolean} options.trimRequestBody - whether to trim fields in request body or not
 * @param {Boolean} options.ES6_enabled - whether to generate snippet with ES6 features
 * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
 * @param {Function} callback - callback function with parameters (error, snippet)
 */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  if (!isFunction(callback)) {
    throw new Error('Nodejs-Unirest-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());

  var indentString;
  indentString = options.indentType === 'Tab' ? '\t' : ' ';
  indentString = indentString.repeat(options.indentCount);

  return callback(null, makeSnippet(request, indentString, options));
}