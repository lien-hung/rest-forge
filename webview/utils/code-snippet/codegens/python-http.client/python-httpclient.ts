import { isFunction } from '../../common/lodash';
import { Request, RequestBody, Url } from 'postman-collection';
import { sanitize } from './util/sanitize';
import parseBody from './util/parseBody';
import { PostgenOption } from '../../common/type';
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
    requestBodyMode = (request.body ? request.body.mode : 'raw'),
    headerMap;

  if (headerArray) {
    headerArray = headerArray.filter((header) => !header.disabled);
    headerMap = headerArray.map(function (header) {
      return `${indentation}'${sanitize(header.key, 'header', true)}': ` +
        `'${sanitize(header.value, 'header')}'`;
    });
    if (requestBodyMode === 'formdata') {
      headerMap.push(`${indentation}'Content-type': 'multipart/form-data; boundary={}'.format(boundary)`);
    }
    return `headers = {\n${headerMap.join(',\n')}\n}\n`;
  }
  if (requestBodyMode === 'formdata') {
    return `headers = {\n${indentation} 'Content-type': ` +
      '\'multipart/form-data; boundary={}\'.format(boundary) \n}\n';
  }
  return 'headers = {}\n';
}

/**
   * Used to return options which are specific to a particular plugin
   *
   * @module getOptions
   *
   * @returns {Array}
   */
export function getOptions(): Array<PostgenOption> {
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
      default: 'Space',
      availableOptions: ['Tab', 'Space'],
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
  * Used to convert the postman sdk-request object in python-httpclient reuqest snippet
  *
  * @module convert
  *
  * @param  {Object} request - postman SDK-request object
  * @param  {Object} options - Options to tweak code snippet generated in Python
  * @param  {String} options.indentType - type of indentation eg: Space / Tab (default: Space)
  * @param  {Number} options.indentCount - frequency of indent (default: 4 for indentType: Space,
                                                                  default: 1 for indentType: Tab)
  * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
                                              (default: 0 -> never bail out)
  * @param {Boolean} options.requestBodyTrim : whether to trim request body fields (default: false)
  * @param {Boolean} options.followRedirect : whether to allow redirects of a request
  * @param  {Function} callback - function with parameters (error, snippet)
  */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  var snippet = '',
    indentation = '',
    identity = '',
    url, host, path, query, contentType;

  if (!isFunction(callback)) {
    throw new Error('Python-Http.Client~convert: Callback is not a function');
  }
  options = sanitizeOptions(options, getOptions());

  identity = options.indentType === 'Tab' ? '\t' : ' ';
  indentation = identity.repeat(options.indentCount);

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

  contentType = request.headers.get('Content-Type');
  snippet += 'import http.client\n';

  // If contentType is json then include the json module for later use
  if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
    snippet += 'import json\n';
  }
  if (request.body && request.body.mode === 'formdata') {
    snippet += 'import mimetypes\n';
    snippet += 'from codecs import encode\n';
  }
  snippet += '\n';
  if (request.url.protocol === 'http') {
    snippet += `conn = http.client.HTTPConnection("${sanitize(host)}"`;
  }
  else {
    snippet += `conn = http.client.HTTPSConnection("${sanitize(host)}"`;
  }
  snippet += url.port ? `, ${request.url.port}` : '';
  snippet += options.requestTimeout !== 0 ? `, timeout = ${options.requestTimeout})\n` : ')\n';

  request.body = solveMultiFile(request.body ?? <RequestBody>{});

  snippet += parseBody(request, indentation, options.trimRequestBody, contentType);
  if (request.body && !contentType) {
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
  snippet += getHeaders(request, indentation);
  snippet += `conn.request("${request.method}",` +
    ` "${sanitize(path)}${sanitize(encodeURI(query))}", payload, headers)\n`;
  snippet += 'res = conn.getresponse()\n';
  snippet += 'data = res.read()\n';
  snippet += 'print(data.decode("utf-8"))';

  return callback(null, snippet);
}
