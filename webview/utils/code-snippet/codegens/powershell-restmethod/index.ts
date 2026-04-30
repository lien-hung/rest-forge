import { FormParam, HeaderDefinition, PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { forEach, isEmpty, isFunction, includes } from '../../common/lodash';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';
import { sanitize } from './util';
import { sanitizeSingleQuotes } from './util';
import { sep } from 'path';
import { SnippetOptions } from './type';
import { PostgenOption } from '../../common/type';

const VALID_METHODS = ['DEFAULT', 'DELETE', 'GET', 'HEAD', 'MERGE', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'];

/**
 * Parses URLEncoded body from request to powershell-restmethod syntax
 *
 * @param {Object} body URLEncoded Body
 */
function parseURLEncodedBody(body: PropertyList<QueryParam>) {
  var bodySnippet = '',
    urlencodedArray = new Array<string>();
  forEach(body, function (data) {
    if (!data.disabled) {
      urlencodedArray.push(`${encodeURIComponent(data.key)}=${encodeURIComponent(data.value)}`);
    }
  });
  if (urlencodedArray.length > 0) {
    bodySnippet = '$body = "' + urlencodedArray.join('&') + '"\n';
  }
  return bodySnippet;
}

/**
 * Parses Formdata from request to powershell-restmethod syntax
 *
 * @param {Object} body FormData body
 * @param {boolean} trim trim body option
 */
function parseFormData(body: PropertyList<FormParam>, trim: boolean) {
  if (isEmpty(body)) {
    return '';
  }

  var bodySnippet = '$multipartContent = [System.Net.Http.MultipartFormDataContent]::new()\n';
  body.each(function (data) {
    if (!data.disabled) {
      if ('type' in data && data.type === 'file' && 'src' in data && typeof data.src === 'string') {
        var pathArray = data.src.split(sep),
          fileName = pathArray[pathArray.length - 1];
        bodySnippet += `$multipartFile = '${data.src}'\n` +
          '$FileStream = [System.IO.FileStream]::new($multipartFile, [System.IO.FileMode]::Open)\n' +
          '$fileHeader = [System.Net.Http.Headers.ContentDispositionHeaderValue]::new("form-data")\n' +
          `$fileHeader.Name = "${sanitize(data.key)}"\n` +
          `$fileHeader.FileName = "${sanitize(fileName, trim)}"\n` +
          '$fileContent = [System.Net.Http.StreamContent]::new($FileStream)\n' +
          '$fileContent.Headers.ContentDisposition = $fileHeader\n' +
          '$multipartContent.Add($fileContent)\n\n';
      } else {
        bodySnippet += '$stringHeader = ' +
          '[System.Net.Http.Headers.ContentDispositionHeaderValue]::new("form-data")\n' +
          `$stringHeader.Name = "${sanitize(data.key, trim)}"\n` +
          `$stringContent = [System.Net.Http.StringContent]::new("${sanitize(data.value, trim)}")\n` +
          '$stringContent.Headers.ContentDisposition = $stringHeader\n' +
          ('contentType' in data ? '$contentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new("' +
            data.contentType + '")\n$stringContent.Headers.ContentType = $contentType\n' : '') +
          '$multipartContent.Add($stringContent)\n\n';
      }
    }
  });
  bodySnippet += '$body = $multipartContent\n';
  return bodySnippet;
}

/**
 * Parses Raw data from request to powershell-restmethod syntax
 *
 * @param {Object} body Raw body data
 * @param {boolean} trim trim body option
 */
function parseRawBody(body: string, trim: boolean) {
  return `$body = @"\n${sanitize(body.toString(), trim, false)}\n"@\n`;
}

/**
 * Parses File data from request to powershell-restmethod syntax
 */
function parseFileData() {
  return '$body = "<file-contents-here>"\n';
}

/**
 * Parses Body from request to powershell-restmethod syntax based on the body mode
 *
 * @param {Object} body body object from request
 * @param {boolean} trim trim body option
 */
function parseBody(body: RequestBody, trim: boolean) {
  if (!isEmpty(body)) {
    switch (body.mode) {
      case 'urlencoded':
        return body.urlencoded ? parseURLEncodedBody(body.urlencoded) : '';
      case 'raw':
        return parseRawBody(String(body.raw), trim);
      case 'formdata':
        return body.formdata ? parseFormData(body.formdata, trim) : '';
      case 'file':
        return parseFileData();
      default:
        return '';
    }
  }
  return '';
}

/**
 * Parses headers from request to powershell-restmethod syntax
 *
 * @param {Object} headers headers from the request
 */
function parseHeaders(headers: HeaderDefinition[]) {
  var headerSnippet = '';
  if (!isEmpty(headers)) {
    headers = headers.filter((header) => !header.disabled);
    headerSnippet = '$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"\n';
    forEach(headers, function (header) {
      headerSnippet += `$headers.Add("${sanitize(header.key, true)}", "${sanitize(header.value)}")\n`;
    });
  } else {
    headerSnippet = '';
  }
  return headerSnippet;
}

/**
 * Used to get the options specific to this codegen
 *
 * @returns {Array} - Returns an array of option objects
 */
export function getOptions(): Array<PostgenOption> {
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
 * Converts Postman sdk request object to powershell-restmethod code snippet
 *
 * @param {Object} request - postman-SDK request object
 * @param {Object} options
 * @param {Boolean} options.followRedirect - whether to enable followredirect
 * @param {Boolean} options.trimRequestBody - whether to trim fields in request body or not
 * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
 * @param {Function} callback - callback function with parameters (error, snippet)
 */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  if (!isFunction(callback)) {
    throw new Error('Powershell RestMethod Converter callback is not a valid function');
  }
  options = sanitizeOptions(options, getOptions());

  var trim = options.trimRequestBody,
    headers,
    codeSnippet = '',
    headerSnippet = '',
    bodySnippet = '';
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

  headers = request.toJSON().header ?? [];
  headerSnippet = parseHeaders(headers);

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  bodySnippet = parseBody(request.body, trim);

  if (headerSnippet !== '') {
    codeSnippet += headerSnippet + '\n';
  }
  if (bodySnippet !== '') {
    codeSnippet += bodySnippet + '\n';
  }

  if (includes(VALID_METHODS, request.method)) {
    codeSnippet += `$response = Invoke-RestMethod '${sanitizeSingleQuotes(request.url.toString())}' -Method '` +
      `${request.method}' -Headers $headers`;
  }
  else {
    codeSnippet += `$response = Invoke-RestMethod '${sanitizeSingleQuotes(request.url.toString())}' -CustomMethod ` +
      `'${sanitizeSingleQuotes(request.method)}' -Headers $headers`;
  }
  if (bodySnippet !== '') {
    codeSnippet += ' -Body $body';
  }
  if (options.requestTimeout > 0) {
    let requestTimeout = options.requestTimeout;
    requestTimeout /= 1000;
    codeSnippet += ` -TimeoutSec ${requestTimeout}`;
  }
  if (!options.followRedirect) {
    codeSnippet += ' -MaximumRedirection 0';
  }
  codeSnippet += '\n$response | ConvertTo-Json';
  callback(null, codeSnippet);
}
