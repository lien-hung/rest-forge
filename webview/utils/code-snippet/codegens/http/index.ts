import { PostgenOption } from '../../common/type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';
import { getBody, getHeaders } from './util';
import { Request, RequestBody, Url } from 'postman-collection';

/**
 * Used in order to get additional options for generation of code snippet (i.e. Include Boilerplate code)
 *
 * @module getOptions
 *
 * @returns {Array} Additional options specific to generation of http code snippet
 */
export function getOptions(): Array<PostgenOption> {
  return [{
    name: 'Trim request body fields',
    id: 'trimRequestBody',
    type: 'boolean',
    default: false,
    description: 'Remove white space and additional lines that may affect the server\'s response'
  }];
}

/**
 * Converts a Postman SDK request to HTTP message
 *
 * @param {Object} request - Postman SDK request
 * @param {Object} options - Options for converter
 * @param {Boolean} options.trimRequestBody - determines whether to trim the body or not
 * @param {Function} callback callback
 * @returns {Function} returns the snippet with the callback function.
 */
export function convert(request: Request, options: { trimRequestBody: boolean; }, callback: Function): Function {
  let snippet = '',
    url, host, path, query, body, headers;
  options = sanitizeOptions(options, getOptions());

  url = Url.parse(request.url.toString());
  host = url.host ? (Array.isArray(url.host) ? url.host.join('.') : url.host) : '';
  host += url.port ? ':' + url.port : '';
  path = url.path ? (Array.isArray(url.path) ? '/' + url.path.join('/') : url.path) : '/';
  query = url.query ? (Array.isArray(url.query) ? url.query.map((q) => `${q.key}=${q.value}`) : typeof url.query === 'string' ? [] : url.query.all().map((q) => `${q.key}=${q.value}`)) : [];

  if (query.length > 0) {
    query = '?' + query.join('&');
  }
  else {
    query = '';
  }

  snippet = `${request.method} ${path}${query} HTTP/1.1\n`;
  snippet += `Host: ${host}`;
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
  body = getBody(request, options.trimRequestBody);
  if (body && body.length !== 0 && !request.headers.has('Content-Length')) {
    request.addHeader({
      key: 'Content-Length',
      value: body.length.toString()
    });
  }
  headers = getHeaders(request);
  snippet += headers ? `\n${headers}` : '';
  snippet += body ? `\n\n${body}` : '';
  return callback(null, snippet);
}
