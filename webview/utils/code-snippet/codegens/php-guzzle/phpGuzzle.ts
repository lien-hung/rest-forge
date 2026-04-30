import getOptions from './options';
import { sanitizeString } from './util/sanitize';
import parseBody from './util/parseBody';
const guzzleTimeout = 'timeout';
const guzzleAllowRedirects = 'allow_redirects';
import { isEmpty } from '../../common/lodash';
import { Header, Request, RequestBody } from 'postman-collection';
import { SnippetOptions } from './type';
import { sanitizeOptions } from '../../common/utils';

/**
 * Gets the defined indentation from options
 *
 * @param  {object} options - process options
 * @returns {String} - indentation characters
 */
function getIndentation(options: SnippetOptions): string {
  if (options && options.indentType && options.indentCount) {
    let charIndentation = options.indentType === 'Tab' ? '\t' : ' ';
    return charIndentation.repeat(options.indentCount);
  }
  return '  ';
}

/**
 * Gets the defined body trim from options
 *
 * @param  {object} options - process options
 * @returns {boolea} - wheter to trim the request body
 */
function getBodyTrim(options: SnippetOptions): boolean {
  if (options && options.trimRequestBody) {
    return options.trimRequestBody;
  }
  return false;
}

/**
 * Takes in an array and group the ones with same key
 *
 * @param  {Array} headerArray - postman SDK-headers
 * @returns request headers in the desired format
 */
function groupHeadersSameKey(headerArray: Header[]) {
  let res: { key: string; value: string }[] = [],
    group = headerArray.reduce((header, a) => {
      header[a.key] = [...header[a.key] || [], a];
      return header;
    }, <Record<string, any>>{});
  Object.keys(group).forEach((item) => {
    const values = group[item].map((child: Header) => child.value);
    res.push({ key: item, value: values.join(', ') });
  });
  return res;
}

/**
 * Transforms an array of headers into the desired form of the language
 *
 * @param  {Array} mapToSnippetArray - array of key values
 * @param  {String} indentation - used for indenting snippet's structure
 * @param  {boolean} sanitize - whether to sanitize the key and values
 * @returns {String} - array in the form of [ key => value ]
 */
function getSnippetArray(mapToSnippetArray: Array<any>, indentation: string, sanitize: boolean): string {
  mapToSnippetArray = groupHeadersSameKey(mapToSnippetArray);
  let mappedArray = mapToSnippetArray.map((entry) => {
    return `${indentation}'${sanitize ? sanitizeString(entry.key, true) : entry.key}' => ` +
      `${sanitize ? '\'' + sanitizeString(entry.value) + '\'' : entry.value}`;
  });
  return `[\n${mappedArray.join(',\n')}\n]`;
}

/**
 * Transforms an array of headers into the desired form of the language
 *
 * @param  {Array} headers - postman SDK-headers
 * @param  {String} indentation - used for indenting snippet's structure
 * @returns {String} - request headers in the desired format
 */
function getSnippetHeaders(headers: Array<any>, indentation: string): string {
  if (headers.length > 0) {
    headers = headers.filter((header) => { return !header.disabled; });
    return `$headers = ${getSnippetArray(headers, indentation, true)};\n`;
  }
  return '';
}

/**
 * Used to get the headers and put them in the desired form of the language
 *
 * @param  {Object} request - postman SDK-request object
 * @returns - request headers in the desired format
 */
function getRequestHeaders(request: Request) {
  return request.headers.all();
}

/**
 * Returns the request's url in string format
 *
 * @param  {Object} request - postman SDK-request object
 * @returns {String} - request url in string representation
 */
function getRequestURL(request: Request): string {
  return request.url.toString();
}

/**
 * Returns the request's url in string format
 *
 * @param  {Object} request - postman SDK-request object
 * @returns {String} - request url in string representation
 */
function getRequestMethod(request: Request): string {
  return request.method;
}

/**
  * Validates if the input is a function
  *
  * @module convert
  *
  * @param  {*} validateFunction - postman SDK-request object
  * @returns {boolean} true if is a function otherwise false
  */
function validateIsFunction(validateFunction: any): boolean {
  return typeof validateFunction === 'function';
}

/**
  * Returns the snippet header
  *
  * @module convert
  * @param  {string} includeBoilerplate - wheter to include the boilerplate
  * @returns {string} the snippet headers (uses)
  */
function getSnippetBoilerplate(includeBoilerplate: boolean): string {
  if (includeBoilerplate) {
    return '<?php\n' +
      '$composerHome = substr(shell_exec(\'composer config home -g\'), 0, -1).\'/vendor/autoload.php\';\n' +
      'require $composerHome; // your path to autoload.php \n' +
      'use Psr\\Http\\Message\\ResponseInterface;\n' +
      'use GuzzleHttp\\Exception\\RequestException;\n' +
      'use GuzzleHttp\\Client;\n' +
      'use GuzzleHttp\\Psr7\\Utils;\n' +
      'use GuzzleHttp\\Psr7\\Request;\n';
  }
  return '<?php\n';
}

/**
  * Returns the snippet footer sync
  *
  * @param  {string} includeRequestOptions - wheter to include the request options
  * @module convert
  * @returns {string} the snippet headers (uses)
  */
function getSnippetFooterSync(includeRequestOptions: boolean): string {
  if (!includeRequestOptions) {
    return '$res = $client->send($request);\n' +
      'echo $res->getBody();\n';
  }
  return '$res = $client->send($request, $options);\n' +
    'echo $res->getBody();\n';
}

/**
  * Returns the snippet footer async
  *
  * @module convert
  * @param  {string} includeRequestOptions - wheter to include the request options
  * @returns {string} the snippet headers (uses)
  */
function getSnippetFooterAsync(includeRequestOptions: boolean): string {
  if (!includeRequestOptions) {
    return '$res = $client->sendAsync($request)->wait();\n' +
      'echo $res->getBody();\n';
  }
  return '$res = $client->sendAsync($request, $options)->wait();\n' +
    'echo $res->getBody();\n';
}

/**
  * Returns the snippet footer
  *
  * @module convert
  * @param  {object} options - process options
  * @param  {boolean} includeRequestOptions - wheter to include the request options
  * @returns {string} the snippet headers (uses)
  */
function getSnippetFooter(options: SnippetOptions, includeRequestOptions: boolean): string {
  if (options && options.asyncType && options.asyncType === 'sync') {
    return getSnippetFooterSync(includeRequestOptions);
  }
  return getSnippetFooterAsync(includeRequestOptions);
}

/**
  * Generates the snippet for creating the request object
  * if has body is true then the body will be added
  *
  * @module convert
  *
  * @param  {string} method - request's method in string representation
  * @param  {string} url - request's url in string representation
  * @param  {boolean} hasBody - wheter the request has body or not
  * @param  {string} snippetHeaders - the generated snippet headers
  * @returns {String} - returns generated PHP-Guzzle snippet for request creation
  */
function getSnippetRequestObject(method: string, url: string, hasBody: boolean, snippetHeaders: string): string {
  if (hasBody && snippetHeaders !== '') {
    return `$request = new Request('${method}', '${url}', $headers, $body);\n`;
  }
  if (!hasBody && snippetHeaders !== '') {
    return `$request = new Request('${method}', '${url}', $headers);\n`;
  }
  if (hasBody && snippetHeaders === '') {
    return `$request = new Request('${method}', '${url}', [], $body);\n`;
  }
  return `$request = new Request('${method}', '${url}');\n`;
}

/**
 * Generates the snippet for the client's creation
 *
 * @param  {object} options - process options
 * @returns {String} - the snippet to create the client
 */
function getSnippetClient(options: SnippetOptions): string {
  if (options) {
    let connectionTimeout = options.requestTimeout,
      followRedirect = options.followRedirect,
      clientOptions = [];
    if (connectionTimeout && connectionTimeout !== 0) {
      clientOptions.push({ key: guzzleTimeout, value: connectionTimeout });
    }
    if (followRedirect === false) {
      clientOptions.push({ key: guzzleAllowRedirects, value: followRedirect });
    }
    if (clientOptions.length > 0) {
      let snippetArrayOptions = getSnippetArray(clientOptions, getIndentation(options), false) + '\n';
      return `$client = new Client(${snippetArrayOptions});\n`;
    }
  }
  return '$client = new Client();\n';
}

/**
  * Add the content type header if needed
  *
  * @module convert
  *
  * @param  {Object} request - postman SDK-request object
  */
function addContentTypeHeader(request: Request) {
  if (request.body && request.body.mode === 'graphql' && !request.headers.has('Content-Type')) {
    request.addHeader({
      key: 'Content-Type',
      value: 'application/json'
    });
  }
}

/**
  * Identifies if the request should have a body
  *
  * @module convert
  *
  * @param  {Object} request - postman SDK-request object
  * @param  {string} snippetBody - generated body snippet
  * @returns {String} - returns generated PHP-Guzzle snippet via callback
*/
function includeBody(request: Request, snippetBody: string): boolean {
  if (isEmpty(request.body) || snippetBody === '' || snippetBody.startsWith('$options')) {
    return false;
  }
  return true;
}

/**
  * Identifies if the params should go as option
  *
  * @module convert
  *
  * @param  {string} snippetBody - generated body snippet
  * @returns {String} - returns generated PHP-Guzzle snippet via callback
*/
function includeRequestOptions(snippetBody: string): boolean {
  return snippetBody.startsWith('$options');
}

/**
 * Gets the defined indentation from options
 *
 * @param  {object} options - process options
 * @returns {String} - indentation characters
 */
function getIncludeBoilerplate(options: SnippetOptions): boolean {
  if (options && options.includeBoilerplate !== undefined && options.includeBoilerplate !== null) {
    return options.includeBoilerplate;
  }
  return false;
}


/**
  * Used to convert the postman sdk-request object in PHP-Guzzle request snippet
  *
  * @module convert
  *
  * @param  {Object} request - postman SDK-request object
 * @param  {object} options - process options
  * @param  {Function} callback - function with parameters (error, snippet)
  * @returns {String} - returns generated PHP-Guzzle snippet via callback
  */
function convert(request: Request, options: SnippetOptions, callback: Function): string {
  if (!validateIsFunction(callback)) {
    throw new Error('Php-Guzzle~convert: Callback is not a function');
  }
  let snippet = '',
    snippetbody,
    requestBuilderSnippet,
    includeParamsAsOption,
    hasBody;
  options = sanitizeOptions(options, getOptions());
  addContentTypeHeader(request);

  const method = getRequestMethod(request),
    indentation = getIndentation(options),
    includeBoilerplate = getIncludeBoilerplate(options),
    url = getRequestURL(request),
    snippetHeaders = getSnippetHeaders(getRequestHeaders(request), indentation),
    snippetHeader = getSnippetBoilerplate(includeBoilerplate),
    snippetClient = getSnippetClient(options);
  snippetbody = parseBody(request.body ?? <RequestBody>{}, indentation, getBodyTrim(options), request.headers.get('Content-Type'));
  hasBody = includeBody(request, snippetbody);
  includeParamsAsOption = includeRequestOptions(snippetbody);
  requestBuilderSnippet = getSnippetRequestObject(method, url, hasBody, snippetHeaders);

  snippet += snippetHeader;
  snippet += snippetClient;
  snippet += snippetHeaders;
  snippet += snippetbody;
  snippet += requestBuilderSnippet;
  snippet += getSnippetFooter(options, includeParamsAsOption);

  return callback(null, snippet);
}

export default {
  /**
   * Used in order to get options for generation of PHP-Guzzle code snippet
   *
   * @module getOptions
   *
   * @returns {Array} Options specific to generation of PHP-Guzzlep code snippet
   */
  getOptions,

  convert,
  getHeaders: getRequestHeaders,
  getSnippetHeaders,
  getSnippetBoilerplate,
  getURL: getRequestURL,
  getMethod: getRequestMethod,
  getIndentation,
  getSnippetClient,
  getSnippetFooter,
  getSnippetRequestObject,
  groupHeadersSameKey,
  getIncludeBoilerplate
};