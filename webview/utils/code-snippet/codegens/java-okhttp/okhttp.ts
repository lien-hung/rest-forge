import { Request, RequestBody } from 'postman-collection';
import { includes, isFunction } from '../../common/lodash';
import { parseContentType, parseBody, parseHeader } from './parseRequest';
import { sanitize } from './util';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

//  Since Java OkHttp requires to add extralines of code to handle methods with body
const METHODS_WITHOUT_BODY = ['HEAD', 'COPY', 'UNLOCK', 'UNLINK', 'PURGE', 'LINK', 'VIEW'];

/**
 * returns snippet of java okhttp by parsing data from Postman-SDK request object
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required for code snippet
 * @param {Object} options - Options to tweak code snippet
 * @returns {String} - java okhttp code snippet for given request object
 */
function makeSnippet(request: Request, indentString: string, options: SnippetOptions): string {
  var isBodyRequired = !(includes(METHODS_WITHOUT_BODY, request.method)),
    snippet = 'OkHttpClient client = new OkHttpClient().newBuilder()\n',
    requestBody;

  if (options.requestTimeout > 0) {
    snippet += indentString + `.setConnectTimeout(${options.requestTimeout}, TimeUnit.MILLISECONDS)\n`;
  }

  if (!options.followRedirect) {
    snippet += indentString + '.followRedirects(false)\n';
  }

  snippet += indentString + '.build();\n';

  if (isBodyRequired) {
    request.body = solveMultiFile(request.body ?? <RequestBody>{});
    requestBody = request.body;
    snippet += `MediaType mediaType = MediaType.parse("${parseContentType(request)}");\n`;
    snippet += parseBody(requestBody, indentString, options.trimRequestBody);
  }

  snippet += 'Request request = new Request.Builder()\n';
  snippet += indentString + `.url("${sanitize(request.url.toString())}")\n`;
  snippet += indentString + `.method("${request.method}", ${isBodyRequired ? 'body' : 'null'})\n`;
  if (request.body && request.body.mode === 'graphql' && !request.headers.has('Content-Type')) {
    request.addHeader({
      key: 'Content-Type',
      value: 'application/json'
    });
  }
  //  java-okhttp snippet for adding headers to request
  snippet += parseHeader(request, indentString);

  snippet += indentString + '.build();\n';
  snippet += 'Response response = client.newCall(request).execute();';

  return snippet;
}

/**
 * Used in order to get options for generation of Java okhattp code snippet (i.e. Include Boilerplate code)
 *
 * @module getOptions
 *
 * @returns {Array} Options specific to generation of Java okhattp code snippet
 */
export function getOptions(): Array<any> {
  return [
    {
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
 * @param {Object} options - Options to tweak code snippet generated in Java-OkHttp
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
    throw new Error('Java-OkHttp-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());
  
  var indentString,
    headerSnippet = '',
    footerSnippet = '',
    snippet = '';

  indentString = options.indentType === 'Tab' ? '\t' : ' ';
  indentString = indentString.repeat(options.indentCount);

  if (options.includeBoilerplate) {
    headerSnippet = 'import java.io.*;\n' +
      'import okhttp3.*;\n' +
      'public class Main {\n' +
      indentString + 'public static void main(String []args) throws IOException{\n';
    footerSnippet = indentString.repeat(2) + 'System.out.println(response.body().string());\n' +
      indentString + '}\n}\n';
  }

  snippet = makeSnippet(request, indentString, options);

  //  if boilerplate is included then two more indentString needs to be added in snippet
  (options.includeBoilerplate) &&
    (snippet = indentString.repeat(2) + snippet.split('\n').join('\n' + indentString.repeat(2)) + '\n');

  return callback(null, headerSnippet + snippet + footerSnippet);
}
