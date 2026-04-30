import { HeaderDefinition, Request, RequestBody } from 'postman-collection';
import { URL } from 'url';
import { isFunction } from '../../common/lodash';
import { PostgenOption } from '../../common/type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';
import { parseBody, parseHeader } from './parseRequest';
import { SnippetOptions } from './type';
import { sanitize } from './util';

/**
* Takes in a string and returns a new string with only the first character capitalized
*
* @param  {string} string - string to change
* @returns {String} - the same string with the first litter as capital letter
*/
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Generates snippet for the RestClientOptions object
 *
 * @param {string} urlOrigin - String representing the origin of the url
 * @param {Object} options - Options to tweak code snippet
 * @param {string} indentString - String representing value of indentation required
 * @param {Array} headers - request headers
 * @returns {String} csharp-restsharp RestClientOptions object snippet
 */
function makeOptionsSnippet(urlOrigin: string, options: SnippetOptions, indentString: string, headers: HeaderDefinition[]): string {
  let userAgentHeader,
    snippet = `var options = new RestClientOptions("${sanitize(urlOrigin)}")\n{\n`;
  if (Array.isArray(headers)) {
    userAgentHeader = headers.find((header) => {
      return (!header.disabled && sanitize(header.key, true).toLowerCase() === 'user-agent');
    });
  }
  if (options.requestTimeout) {
    snippet += `${indentString}MaxTimeout = ${options.requestTimeout},\n`;
  }
  else {
    snippet += `${indentString}MaxTimeout = -1,\n`;
  }
  if (!options.followRedirect) {
    snippet += `${indentString}FollowRedirects = false,\n`;
  }
  if (userAgentHeader) {
    snippet += `${indentString}UserAgent = "${userAgentHeader.value}",\n`;
  }
  snippet += '};\n';
  return snippet;
}

/**
 * Generates an URL object from the string
 *
 * @param {string} stringToParse - url in string representation
 * @returns {object} the URL object
 */
function parseURL(stringToParse: string): URL | undefined {
  try {
    let objectURL = new URL(stringToParse);
    return objectURL;
  }
  catch (err) {
    try {
      var url = require('url');
      let urlObj = url.parse(stringToParse);
      if (urlObj.hostname === null) {
        return;
      }
      return urlObj;
    }
    catch (parseErr) {
      return;
    }
  }
}

/**
 * Generates snippet in csharp-restsharp by parsing data from Postman-SDK request object
 *
 * @param {Object} request - Postman SDK request object
 * @param {Object} options - Options to tweak code snippet
 * @param {string} indentString - String representing value of indentation required
 * @returns {string} csharp-restsharp code snippet for given request object
 */
function makeSnippet(request: Request, options: SnippetOptions, indentString: string): string {
  const UNSUPPORTED_METHODS_LIKE_POST = ['LINK', 'UNLINK', 'LOCK', 'PROPFIND'],
    UNSUPPORTED_METHODS_LIKE_GET = ['PURGE', 'UNLOCK', 'VIEW'],
    isUnSupportedMethod = UNSUPPORTED_METHODS_LIKE_GET.includes(request.method) ||
      UNSUPPORTED_METHODS_LIKE_POST.includes(request.method),
    url = parseURL(request.url.toString()),
    urlOrigin = url ? parseURL(request.url.toString())?.origin || '' : request.url.toString(),
    urlPathAndHash = url ? request.url.toString().replace(urlOrigin, '') : '';

  let snippet = makeOptionsSnippet(urlOrigin, options, indentString, request.toJSON().header ?? []);
  snippet += 'var client = new RestClient(options);\n';
  snippet += `var request = new RestRequest("${sanitize(urlPathAndHash)}", ` +
    `${isUnSupportedMethod ? 'Method.Get' : ('Method.' + capitalizeFirstLetter(request.method))});\n`;
  if (request.body && request.body.mode === 'graphql' && !request.headers.has('Content-Type')) {
    request.addHeader({
      key: 'Content-Type',
      value: 'application/json'
    });
  }
  snippet += parseHeader(request.toJSON());
  if (request.body?.formdata) {
    snippet += 'request.AlwaysMultipartFormData = true;\n';
  }

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  snippet += parseBody(request, options.trimRequestBody);
  if (isUnSupportedMethod) {
    snippet += 'request.OnBeforeRequest = (request) =>\n';
    snippet += '{\n';
    snippet += `${indentString}request.Method = new HttpMethod("${request.method}");\n`;
    snippet += `${indentString}return default;\n`;
    snippet += '};\n';
  }

  snippet += 'RestResponse response = await client.ExecuteAsync(request);\n';
  snippet += 'Console.WriteLine(response.Content);';

  return snippet;
}

/**
 * Used in order to get additional options for generation of C# code snippet (i.e. Include Boilerplate code)
 *
 * @module getOptions
 *
 * @returns {Array} Additional options specific to generation of csharp-restsharp code snippet
 */
export function getOptions(): Array<PostgenOption> {
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
   * Converts Postman sdk request object to csharp-restsharp code snippet
   *
   * @module convert
   *
   * @param {Object} request - Postman-SDK request object
   * @param {Object} options - Options to tweak code snippet generated in C#
   * @param {String} options.indentType - type for indentation eg: Space, Tab (default: Space)
   * @param {String} options.indentCount - number of spaces or tabs for indentation. (default: 4 for indentType:
                                                                       Space, default: 1 for indentType: Tab)
   * @param {Boolean} [options.includeBoilerplate] - indicates whether to include class definition in C#
   * @param {Boolean} options.followRedirect - whether to enable followredirect
   * @param {Boolean} options.trimRequestBody - whether to trim fields in request body or not (default: false)
   * @param {Number} options.requestTimeout - time in milli-seconds after which request will bail out
                                                   (default: 0 -> never bail out)
   * @param {Function} callback - Callback function with parameters (error, snippet)
   * @returns {String} Generated C# snippet via callback
   */
export function convert(request: Request, options: SnippetOptions, callback: Function): string {
  if (!isFunction(callback)) {
    throw new Error('C#-RestSharp-Converter: Callback is not valid function');
  }

  var indentString,
    headerSnippet = '',
    footerSnippet = '',
    mainMethodSnippet = '',
    importTask = '',
    snippet = '';

  options = sanitizeOptions(options, getOptions());

  indentString = options.indentType === 'Tab' ? '\t' : ' ';
  indentString = indentString.repeat(options.indentCount ?? 2);

  if (options.includeBoilerplate) {
    mainMethodSnippet = indentString.repeat(2) + 'static async Task Main(string[] args) {\n';
    importTask = 'using System.Threading;\nusing System.Threading.Tasks;\n';

    headerSnippet = 'using System;\n' +
      'using RestSharp;\n' +
      importTask +
      'namespace HelloWorldApplication {\n' +
      indentString + 'class HelloWorld {\n' +
      mainMethodSnippet;
    footerSnippet = indentString.repeat(2) + '}\n' + indentString + '}\n}\n';
  }

  snippet = makeSnippet(request, options, indentString);

  //  if boilerplate is included then two more indentString needs to be added in snippet
  (options.includeBoilerplate) &&
    (snippet = indentString.repeat(3) + snippet.split('\n').join('\n' + indentString.repeat(3)) + '\n');

  return callback(null, headerSnippet + snippet + footerSnippet);
}
