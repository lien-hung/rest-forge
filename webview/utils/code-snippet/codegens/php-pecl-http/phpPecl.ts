import { Request } from 'postman-collection';
import { isEmpty, isFunction } from '../../common/lodash';
import parseBody from './util/parseBody';
import { sanitize } from './util/sanitize';
import { PostgenOption } from '../../common/type';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * Used to get the headers and put them in the desired form of the language
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
      return `${indentation}'${sanitize(header.key, true)}' => ` +
        `'${sanitize(header.value)}'`;
    });
    return `$request->setHeaders(array(\n${headerMap.join(',\n')}\n));`;
  }
  return '';
}

/**
   * @returns {Array} plugin specific options
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
    },
    {
      name: 'Follow redirects',
      id: 'followRedirect',
      type: 'boolean',
      default: true,
      description: 'Automatically follow HTTP redirects'
    }
  ];
}

/**
   * @param  {Object} request - postman SDK-request object
   * @param  {Object} options
   * @param  {String} options.indentType - type of indentation eg: spaces/Tab (default: Space)
   * @param  {String} options.indentCount - frequency of indent (default: 4 for indentType: Space,
   *                                                               default: 2 for indentType: Tab)
   * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
                                              (default: 0 -> never bail out)
   * @param {Boolean} options.trimRequestBody : whether to trim request body fields (default: false)
   * @param {Boolean} options.followRedirect : whether to allow redirects of a request
   * @param  {Function} callback - function with parameters (error, snippet)
   */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  var snippet = '',
    indentation = '',
    identity = '';

  if (!isFunction(callback)) {
    throw new Error('Php-Pecl(HTTP)~convert: Callback is not a function');
  }
  options = sanitizeOptions(options, getOptions());

  identity = options.indentType === 'Tab' ? '\t' : ' ';
  indentation = identity.repeat(options.indentCount);

  snippet = '<?php\n';
  snippet += '$client = new http\\Client;\n';
  snippet += '$request = new http\\Client\\Request;\n';
  snippet += `$request->setRequestUrl('${sanitize(request.url.toString())}');\n`;
  snippet += `$request->setRequestMethod('${request.method}');\n`;
  if (request.body && !isEmpty(request.body)) {
    request.body = solveMultiFile(request.body);
    snippet += '$body = new http\\Message\\Body;\n';
    snippet += `${parseBody(request, indentation, options.trimRequestBody)}`;
    snippet += '$request->setBody($body);\n';
  }
  snippet += '$request->setOptions(array(';
  snippet += options.requestTimeout === 0 ? '' : `'connecttimeout' => ${options.requestTimeout}`;
  snippet += options.followRedirect ? '' : ', \'redirect\' => false';
  snippet += '));\n';
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
  snippet += `${getHeaders(request, indentation)}\n`;
  snippet += '$client->enqueue($request)->send();\n';
  snippet += '$response = $client->getResponse();\n';
  snippet += 'echo $response->getBody();\n';

  return callback(null, snippet);
}