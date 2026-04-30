import { Request, RequestBody } from 'postman-collection';
import { isEmpty, forEach, isFunction, includes, capitalize } from '../../common/lodash';
import { PostgenOption } from '../../common/type';
import parseBody from './util/parseBody';
import { sanitize } from './util/sanitize';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';
import { SnippetOptions } from './type';

/**
 * Used to parse the request headers
 *
 * @param  {Object} headers - postman SDK-request object
 * @returns {String} - request headers in the desired format
 */
function parseHeaders(headers: object) {
  var headerSnippet = '';
  if (!isEmpty(headers)) {
    forEach(headers, function (value, key) {
      if (Array.isArray(value)) {
        const headerValues = value.map((singleValue) => `"${sanitize(singleValue, 'header')}"`);
        headerSnippet += `request["${sanitize(String(key), 'header', true)}"] = [${headerValues.join(', ')}]\n`;
      } else {
        headerSnippet += `request["${sanitize(String(key), 'header', true)}"] = "${sanitize(value, 'header')}"\n`;
      }
    });
  }
  return headerSnippet;
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
  }];
}

/**
  * Used to convert the postman sdk-request object in ruby request snippet
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
    headerSnippet = '',
    methods = ['GET', 'POST', 'HEAD', 'DELETE', 'PATCH', 'PROPFIND',
      'PROPPATCH', 'PUT', 'OPTIONS', 'COPY', 'LOCK', 'UNLOCK', 'MOVE', 'TRACE'],
    contentType;

  if (!isFunction(callback)) {
    throw new Error('Ruby~convert: Callback is not a function');
  }
  options = sanitizeOptions(options, getOptions());

  identity = options.indentType === 'Tab' ? '\t' : ' ';
  indentation = identity.repeat(options.indentCount);
  // concatenation and making up the final string
  snippet = 'require "uri"\n';

  contentType = request.headers.get('Content-Type');
  // If contentType is json then include the json module for later use
  if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
    snippet += 'require "json"\n';
  }

  snippet += 'require "net/http"\n\n';
  if (!includes(methods, request.method)) {
    snippet += `class Net::HTTP::${capitalize(request.method)} < Net::HTTPRequest\n`;
    snippet += `${indentation}METHOD = "${request.method}"\n`;
    snippet += `${indentation}REQUEST_HAS_BODY = ${!isEmpty(request.body)}\n`;
    snippet += `${indentation}RESPONSE_HAS_BODY = true\n`;
    snippet += 'end\n\n';
  }
  snippet += `url = URI("${sanitize(request.url.toString(), 'url')}")\n\n`;
  if (sanitize(request.url.toString(), 'url').startsWith('https')) {
    snippet += 'https = Net::HTTP.new(url.host, url.port)\n';
    snippet += 'https.use_ssl = true\n\n';
    if (options.requestTimeout) {
      snippet += `https.read_timeout = ${Math.ceil(options.requestTimeout / 1000)}\n`;
    }
    snippet += `request = Net::HTTP::${capitalize(request.method)}.new(url)\n`;
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
    headerSnippet = parseHeaders(request.getHeaders({ enabled: true }));
    if (headerSnippet !== '') {
      snippet += headerSnippet;
    }

    request.body = solveMultiFile(request.body ?? <RequestBody>{});
    snippet += `${parseBody(request, options.trimRequestBody, contentType, options.indentCount)}\n`;
    snippet += 'response = https.request(request)\n';
    snippet += 'puts response.read_body\n';
  }
  else {
    snippet += 'http = Net::HTTP.new(url.host, url.port);\n';
    if (options.requestTimeout) {
      snippet += `http.read_timeout = ${Math.ceil(options.requestTimeout / 1000)}\n`;
    }
    snippet += `request = Net::HTTP::${capitalize(request.method)}.new(url)\n`;
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
    headerSnippet = parseHeaders(request.getHeaders({ enabled: true }));

    if (headerSnippet !== '') {
      snippet += headerSnippet;
    }
    snippet += `${parseBody(request, options.trimRequestBody, contentType, options.indentCount)}\n`;
    snippet += 'response = http.request(request)\n';
    snippet += 'puts response.read_body\n';
  }

  return callback(null, snippet);
}
