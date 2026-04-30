import { Request, RequestBody } from 'postman-collection';
import { isEmpty, get, isFunction } from '../../common/lodash';
import { parseBody, parseHeader } from './parseRequest';
import { sanitize } from './util';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * returns snippet of nodejs(axios) by parsing data from Postman-SDK request object
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required for code snippet
 * @param {Object} options
 * @returns {String} - nodejs(axios) code snippet for given request object
 */
function makeSnippet(request: Request, indentString: string, options: SnippetOptions): string {
  let snippet = 'const',
    configArray = [],
    dataSnippet = '',
    body,
    headers;

  snippet += ' axios = require(\'axios\');\n';
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

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  body = request.body;

  dataSnippet = !isEmpty(body) ? parseBody(body,
    options.trimRequestBody,
    indentString,
    request.headers.get('Content-Type')) : '';
  snippet += dataSnippet + '\n';

  configArray.push(indentString + `method: '${request.method.toLowerCase()}'`);
  configArray.push(indentString + 'maxBodyLength: Infinity');
  configArray.push(indentString + `url: '${sanitize(request.url.toString())}'`);

  headers = parseHeader(request, indentString);
  // https://github.com/axios/axios/issues/789#issuecomment-577177492
  if (!isEmpty(body) && body.formdata) {
    // we can assume that data object is filled up
    headers.push(`${indentString.repeat(2)}...data.getHeaders()`);
  }
  let headerSnippet = indentString + 'headers: { ';
  if (headers.length > 0) {
    headerSnippet += '\n';
    headerSnippet += headers.join(', \n') + '\n';
    headerSnippet += indentString + '}';
  }
  else {
    headerSnippet += '}';
  }

  configArray.push(headerSnippet);

  if (options.requestTimeout) {
    configArray.push(indentString + `timeout: ${options.requestTimeout}`);
  }
  if (get(request, 'protocolProfileBehavior.followRedirects', options.followRedirect) === false) {
    // setting the maxRedirects to 0 will disable any redirects.
    // by default, maxRedirects are set to 5
    configArray.push(indentString + 'maxRedirects: 0');
  }
  if (dataSnippet !== '') {
    // although just data is enough, whatever :shrug:
    configArray.push(indentString + 'data : data');
  }

  snippet += 'let config = {\n';
  snippet += configArray.join(',\n') + '\n';
  snippet += '};\n\n';

  if (options.asyncAwaitEnabled) {
    snippet += 'async function makeRequest() {\n';
    snippet += indentString + 'try {\n';
    snippet += indentString.repeat(2) + 'const response = await axios.request(config);\n';
    snippet += indentString.repeat(2) + 'console.log(JSON.stringify(response.data));\n';
    snippet += indentString + '}\n';
    snippet += indentString + 'catch (error) {\n';
    snippet += indentString.repeat(2) + 'console.log(error);\n';
    snippet += indentString + '}\n';
    snippet += '}\n\n';
    snippet += 'makeRequest();\n';
  }
  else {
    snippet += 'axios.request(config)\n';
    snippet += '.then((response) => {\n';
    snippet += indentString + 'console.log(JSON.stringify(response.data));\n';
    snippet += '})\n';
    snippet += '.catch((error) => {\n';
    snippet += indentString + 'console.log(error);\n';
    snippet += '});\n';
  }

  return snippet;
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
      name: 'Use async/await',
      id: 'asyncAwaitEnabled',
      type: 'boolean',
      default: false,
      description: 'Modifies code snippet to use async/await'
    }
  ];
}


/**
 * Converts Postman sdk request object to nodejs axios code snippet
 *
 * @param {Object} request - postman-SDK request object
 * @param {Object} options
 * @param {String} options.indentType - type for indentation eg: Space, Tab
 * @param {String} options.indentCount - number of spaces or tabs for indentation.
 * @param {Boolean} options.followRedirect - whether to enable followredirect
 * @param {Boolean} options.trimRequestBody - whether to trim fields in request body or not
 * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
 * @param {Function} callback - callback function with parameters (error, snippet)
 */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  if (!isFunction(callback)) {
    throw new Error('NodeJS-Axios-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());

  //  String representing value of indentation required
  let indentString;

  indentString = options.indentType === 'Tab' ? '\t' : ' ';
  indentString = indentString.repeat(options.indentCount);

  return callback(null, makeSnippet(request, indentString, options));
}