import { isEmpty, isFunction } from '../../common/lodash';
import { Request, RequestBody, Url } from 'postman-collection';
import { sanitize } from './util';
import { parseBody, parseHeader } from './parseRequest';
import { PostgenOption } from '../../common/type';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * returns snippet of nodejs(native) by parsing data from Postman-SDK request object
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required for code snippet
 * @param {Object} options
 * @returns {String} - nodejs(native) code snippet for given request object
 */
function makeSnippet(request: Request, indentString: string, options: SnippetOptions): string {
  var nativeModule = (request.url.protocol === 'http' ? 'http' : 'https'),
    snippet,
    optionsArray = [],
    postData = '',
    url, host, path, query;

  if (options.ES6_enabled) {
    snippet = 'const ';
  }
  else {
    snippet = 'var ';
  }
  if (options.followRedirect) {
    snippet += `${nativeModule} = require('follow-redirects').${nativeModule};\n`;
  }
  else {
    snippet += `${nativeModule} = require('${nativeModule}');\n`;
  }
  if (options.ES6_enabled) {
    snippet += 'const ';
  }
  else {
    snippet += 'var ';
  }
  snippet += 'fs = require(\'fs\');\n\n';
  if (request.body?.mode && request.body.mode === 'urlencoded') {
    if (options.ES6_enabled) {
      snippet += 'const ';
    }
    else {
      snippet += 'var ';
    }
    snippet += 'qs = require(\'querystring\');\n\n';
  }
  if (options.ES6_enabled) {
    snippet += 'let ';
  }
  else {
    snippet += 'var ';
  }
  snippet += 'options = {\n';

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  if (request.body && request.body.mode in request.body) {
    postData += parseBody(request.body, indentString, options.trimRequestBody,
      request.headers.get('Content-Type'));
  }
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

  url = Url.parse(request.url.toString());
  host = url.host ? (Array.isArray(url.host) ? url.host.join('.') : url.host) : '';
  path = url.path ? (Array.isArray(url.path) ? '/' + url.path.join('/') : url.path) : '/';
  query = url.query 
    ? (Array.isArray(url.query)
      ? url.query.map((q) => `${q.key}=${q.value}`)
      : (typeof url.query !== 'string'
        ? url.query.all().map((q) => `${q.key}=${q.value}`)
        : []))
    : [];

  if (query.length > 0) {
    query = '?' + query.join('&');
  }
  else {
    query = '';
  }

  optionsArray.push(indentString + `'method': '${request.method}'`);
  optionsArray.push(`${indentString}'hostname': '${sanitize(host)}'`);
  if (url.port) {
    optionsArray.push(`${indentString}'port': ${url.port}`);
  }
  optionsArray.push(`${indentString}'path': '${sanitize(path)}${sanitize(encodeURI(query))}'`);
  optionsArray.push(parseHeader(request, indentString));
  if (options.followRedirect) {
    optionsArray.push(indentString + '\'maxRedirects\': 20');
  }

  snippet += optionsArray.join(',\n') + '\n';
  snippet += '};\n\n';
  if (options.ES6_enabled) {
    snippet += 'const ';
  }
  else {
    snippet += 'var ';
  }
  snippet += `req = ${nativeModule}.request(options, `;
  if (options.ES6_enabled) {
    snippet += '(res) => {\n';
    snippet += indentString + 'let chunks = [];\n\n';
    snippet += indentString + 'res.on("data", (chunk) => {\n';
  }
  else {
    snippet += 'function (res) {\n';
    snippet += indentString + 'var chunks = [];\n\n';
    snippet += indentString + 'res.on("data", function (chunk) {\n';
  }
  snippet += indentString.repeat(2) + 'chunks.push(chunk);\n';
  snippet += indentString + '});\n\n';

  if (options.ES6_enabled) {
    snippet += indentString + 'res.on("end", (chunk) => {\n';
    snippet += indentString.repeat(2) + 'let body = Buffer.concat(chunks);\n';
  }
  else {
    snippet += indentString + 'res.on("end", function (chunk) {\n';
    snippet += indentString.repeat(2) + 'var body = Buffer.concat(chunks);\n';
  }
  snippet += indentString.repeat(2) + 'console.log(body.toString());\n';
  snippet += indentString + '});\n\n';
  if (options.ES6_enabled) {
    snippet += indentString + 'res.on("error", (error) => {\n';
  }
  else {
    snippet += indentString + 'res.on("error", function (error) {\n';
  }

  snippet += indentString.repeat(2) + 'console.error(error);\n';
  snippet += indentString + '});\n';
  snippet += '});\n\n';

  if (request.body && !(isEmpty(request.body)) && postData.length) {
    if (options.ES6_enabled) {
      snippet += 'let ';
    }
    else {
      snippet += 'var ';
    }
    snippet += `postData = ${postData};\n\n`;

    if (request.method === 'DELETE') {
      snippet += 'req.setHeader(\'Content-Length\', postData.length);\n\n';
    }

    if (request.body.mode === 'formdata') {
      snippet += 'req.setHeader(\'content-type\',' +
        ' \'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW\');\n\n';
    }

    snippet += 'req.write(postData);\n\n';
  }

  if (options.requestTimeout) {
    snippet += `req.setTimeout(${options.requestTimeout}, function() {\n`;
    snippet += indentString + 'req.abort();\n';
    snippet += '});\n\n';
  }

  snippet += 'req.end();';
  return snippet;
}

/**
 * Used to return options which are specific to a particular plugin
 *
 * @returns {Array}
 */
export function getOptions(): Array<PostgenOption> {
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
  },
  {
    name: 'Enable ES6 features',
    id: 'ES6_enabled',
    type: 'boolean',
    default: false,
    description: 'Modifies code snippet to incorporate ES6 (EcmaScript) features'
  }];
}

/**
  * Converts Postman sdk request object to nodejs native code snippet
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
    throw new Error('NodeJS-Request-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());

  var indentString;
  indentString = options.indentType === 'Tab' ? '\t' : ' ';
  indentString = indentString.repeat(options.indentCount);

  return callback(null, makeSnippet(request, indentString, options));
}
