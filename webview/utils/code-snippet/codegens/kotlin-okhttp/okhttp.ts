import { Request, RequestBody } from 'postman-collection';
import { includes, get, isFunction } from '../../common/lodash';
import { parseContentType, parseBody, parseHeader } from './parseRequest';
import { sanitize } from './util';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

//  Since Kotlin OkHttp requires to add extralines of code to handle methods with body
const METHODS_WITHOUT_BODY = ['GET', 'HEAD', 'COPY', 'UNLOCK', 'UNLINK', 'PURGE', 'LINK', 'VIEW'];

/**
 * returns snippet of kotlin okhttp by parsing data from Postman-SDK request object
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required for code snippet
 * @param {Object} options - Options to tweak code snippet
 * @returns {String} - kotlin okhttp code snippet for given request object
 */
function makeSnippet(request: Request, indentString: string, options: SnippetOptions): string {
  let isBodyRequired = !(includes(METHODS_WITHOUT_BODY, request.method)),
    snippet = 'val client = OkHttpClient',
    hasNoOptions = !(options.requestTimeout || options.followRedirects);

  if (hasNoOptions) {
    snippet += '()\n';
  }
  else {
    snippet += '.Builder()\n';
    if (options.requestTimeout > 0) {
      snippet += indentString + `.connectTimeout(${options.requestTimeout}, TimeUnit.SECONDS)\n`;
    }

    if (get(request, 'protocolProfileBehavior.followRedirects', options.followRedirect) === false) {
      snippet += indentString + '.followRedirects(false)\n';
    }

    snippet += indentString + '.build()\n';
  }

  if (isBodyRequired) {
    request.body = solveMultiFile(request.body ?? <RequestBody>{});
    const contentType = parseContentType(request),
      requestBody = request.body ?? <RequestBody>{};
    snippet += `val mediaType = "${contentType}".toMediaType()\n`;
    snippet += parseBody(requestBody, indentString, options.trimRequestBody, contentType);
  }

  snippet += 'val request = Request.Builder()\n';
  snippet += indentString + `.url("${sanitize(request.url.toString())}")\n`;
  if (isBodyRequired) {
    switch (request.method) {
      case 'POST':
        snippet += indentString + '.post(body)\n';
        break;
      case 'PUT':
        snippet += indentString + '.put(body)\n';
        break;
      case 'PATCH':
        snippet += indentString + '.patch(body)\n';
        break;
      default:
        snippet += indentString + `.method("${request.method}", body)\n`;
    }
  }
  if (request.body && request.body.mode === 'graphql' && !request.headers.has('Content-Type')) {
    request.addHeader({
      key: 'Content-Type',
      value: 'application/json'
    });
  }
  //  kotlin-okhttp snippet for adding headers to request
  snippet += parseHeader(request, indentString);

  snippet += indentString + '.build()\n';
  snippet += 'val response = client.newCall(request).execute()';

  return snippet;
}

/**
 * Used in order to get options for generation of Java okhttp code snippet (i.e. Include Boilerplate code)
 *
 * @module getOptions
 *
 * @returns {Array} Options specific to generation of Java okhttp code snippet
 */
export function getOptions(): Array<any> {
  return [{
    name: 'Include boilerplate',
    id: 'includeBoilerplate',
    type: 'boolean',
    default: false,
    description: 'Include class definition and import statements in snippet'
  },
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
    description: 'Set number of milliseconds the request should wait for a response ' +
      'before timing out (use 0 for infinity)'
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
 * Converts Postman sdk request object to java okhttp code snippet
 *
 * @module convert
 *
 * @param {Object} request - postman-SDK request object
 * @param {Object} options - Options to tweak code snippet generated in kotlin-okhttp
 * @param {String} options.indentType - type for indentation eg: Space, Tab
 * @param {String} options.indentCount - number of spaces or tabs for indentation.
 * @param {Boolean} [options.includeBoilerplate] - indicates whether to include class definition in java
 * @param {Boolean} options.followRedirect - whether to enable followredirect
 * @param {Boolean} options.trimRequestBody - whether to trim fields in request body or not
 * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
 * @param {Function} callback - callback function with parameters (error, snippet)
 */
export function convert(request: Request, options: SnippetOptions, callback: Function) {
  if (!isFunction(callback)) {
    throw new Error('kotlin-okhttp-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());

  var indentString,
    headerSnippet = '',
    footerSnippet = '',
    snippet = '';

  indentString = options.indentType === 'Tab' ? '\t' : ' ';
  indentString = indentString.repeat(options.indentCount);

  if (options.includeBoilerplate) {
    headerSnippet = 'import okhttp3.MediaType.Companion.toMediaType\n' +
      'import okhttp3.MultipartBody\n' +
      'import okhttp3.OkHttpClient\n' +
      'import okhttp3.Request\n' +
      'import okhttp3.RequestBody.Companion.toRequestBody\n' +
      'import okhttp3.RequestBody.Companion.asRequestBody\n' +
      'import java.io.File\n' +
      'import java.util.concurrent.TimeUnit\n\n';

    footerSnippet = '\n\nprintln(response.body!!.string())\n';
  }

  snippet = makeSnippet(request, indentString, options);

  return callback(null, headerSnippet + snippet + footerSnippet);
}
