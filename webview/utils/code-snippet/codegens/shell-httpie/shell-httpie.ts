import { Request, RequestBody } from 'postman-collection';
import { isFunction } from '../../common/lodash';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';
import { addHeaders, getRequestBody } from './util/helpers';
import { quote } from './util/sanitize';

const GAP = ' ',
  URLENCODED = 'urlencoded',
  FORM_DATA = 'formdata',
  RAW = 'raw',
  GRAPHQL = 'graphql',
  FILE = 'file';

/**
 * Used to return options which are specific to a particular plugin
 *
 * @returns {Array}
 */
export function getOptions() {
  return [
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
    }
  ];
}

/**
  * Used to convert the postman sdk-request object in shell-httpie reuqest snippet
  *
  * @param  {Object} request - postman SDK-request object
  * @param  {Object} options
  * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
                                              (default: 0 -> never bail out)
  * @param {Boolean} options.followRedirect : whether to allow redirects of a request
  * @param  {Function} callback - function with parameters (error, snippet)
  */
export function convert(request: Request, options: { requestTimeout: number, followRedirect: boolean }, callback: Function) {
  var snippet = '',
    parsedBody,
    parsedHeaders,
    bodyMode,
    timeout,
    url,
    handleRedirect = (enableRedirect: boolean) => { if (enableRedirect) { return GAP + '--follow' + GAP; } return GAP; },
    handleRequestTimeout = (time: number) => {
      if (time) {
        return '--timeout ' + (time / 1000) + GAP;
      }
      return '--timeout 3600' + GAP;
    };

  if (!isFunction(callback)) {
    throw new Error('Shell-Httpie~convert: Callback not a function');
  }

  options = sanitizeOptions(options, getOptions());

  url = quote(request.url.toString());
  timeout = options.requestTimeout;
  if (request.body && request.body.mode === 'graphql' && !request.headers.has('Content-Type')) {
    request.addHeader({
      key: 'Content-Type',
      value: 'application/json'
    });
  }
  parsedHeaders = addHeaders(request);

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  if (request.hasOwnProperty('body')) {
    if (request.body.hasOwnProperty('mode')) {
      bodyMode = request.body.mode;
      // @ts-expect-error
      parsedBody = getRequestBody(request.body[bodyMode], bodyMode);
      switch (bodyMode) {
        case URLENCODED:
          snippet += 'http --ignore-stdin --form' + handleRedirect(options.followRedirect);
          snippet += handleRequestTimeout(timeout);
          snippet += request.method + GAP + url + ' \\\n';
          snippet += parsedBody + (parsedHeaders ? (' \\\n' + parsedHeaders) : '');
          break;

        case FORM_DATA:
          snippet += 'http --ignore-stdin --form' + handleRedirect(options.followRedirect);
          snippet += handleRequestTimeout(timeout);
          snippet += request.method + GAP + url + ' \\\n';
          snippet += parsedBody + (parsedHeaders ? (' \\\n' + parsedHeaders) : '');
          break;

        case RAW:
          if (parsedBody) {
            snippet += 'printf ' + parsedBody + '| ';
          }
          snippet += 'http ' + handleRedirect(options.followRedirect) + handleRequestTimeout(timeout);
          snippet += request.method + GAP + url + (parsedHeaders ? (' \\\n' + parsedHeaders) : '');
          break;
        case GRAPHQL:
          if (parsedBody) {
            snippet += 'printf ' + parsedBody + '| ';
          }
          snippet += 'http ' + handleRedirect(options.followRedirect) + handleRequestTimeout(timeout);
          snippet += request.method + GAP + url + (parsedHeaders ? (' \\\n' + parsedHeaders) : '');
          break;
        case FILE:
          snippet += `cat ${parsedBody} | `;
          snippet += 'http ' + handleRedirect(options.followRedirect) + handleRequestTimeout(timeout);
          snippet += request.method + GAP + url + (parsedHeaders ? (' \\\n' + parsedHeaders) : '');
          break;
        default:
          return callback('Shell-Httpie~convert: Not a valid Content-Type in request body', null);
      }
    }
    else {
      snippet += 'http' + handleRedirect(options.followRedirect) + handleRequestTimeout(timeout);
      snippet += request.method + GAP + url + (parsedHeaders ? (' \\\n' + parsedHeaders) : '');
    }
  }
  else { // forming a request without a body
    snippet += 'http' + handleRedirect(options.followRedirect) + handleRequestTimeout(timeout);
    snippet += request.method + GAP + url + (parsedHeaders ? (' \\\n' + parsedHeaders) : '');
  }

  callback(null, snippet);
}

