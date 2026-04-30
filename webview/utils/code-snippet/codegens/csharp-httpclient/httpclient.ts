import { Request } from 'postman-collection';
import { isFunction } from '../../common/lodash';
import { PostgenOption } from '../../common/type';
import { sanitizeOptions } from '../../common/utils';
import CodeBuilder from './CodeBuilder';
import { parseBody, parseHeader } from './parseRequest';
import { SnippetOptions } from './type';
import { csharpify, sanitize } from './util';

/**
 *
 * @param {CodeBuilder} builder - Code builder for generating code
 * @param {Object} request - Postman SDK request object
 * @param {Object} options - Options to tweak code snippet generated in C#
 * @param {String} options.indentType - type for indentation eg: Space, Tab (default: Space)
 * @param {String} options.indentCount - number of spaces or tabs for indentation. (default: 4 for indentType:
 *                                      Space, default: 1 for indentType: Tab)
 * @param {Boolean} [options.includeBoilerplate] - indicates whether to include class definition in C#
 * @param {Number} options.requestTimeout - time in seconds after which request will bail out
 *                                               (default: 0 -> use .NET default timeout of 100 seconds)
 * @param {Boolean} options.followRedirect - whether to enable follow redirect
 * @returns csharp-httpclient code snippet for given request object
 */
function makeSnippet(builder: CodeBuilder, request: Request, options: SnippetOptions) {
  const IS_PROPERTY_METHOD = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'];

  if (options.followRedirect) {
    // By default .NET does follow redirects so we can just leave this alone
    builder.appendLine('var client = new HttpClient();');
  }
  else {
    builder.appendBlock('var client = new HttpClient(new HttpClientHandler');
    builder.appendLine('AllowAutoRedirect = false,');
    builder.endBlock(');');
  }

  if (options.requestTimeout !== 0) {
    builder.appendLine(`client.Timeout = TimeSpan.FromSeconds(${options.requestTimeout});`);
  }

  // Create the request
  builder.append(`${builder.indentation}var request = new HttpRequestMessage(`);

  if (IS_PROPERTY_METHOD.includes(request.method)) {
    builder.append(`HttpMethod.${csharpify(request.method)}`);
  }
  else {
    builder.append(`new HttpMethod("${request.method}")`);
  }

  builder.append(`, "${sanitize(request.url.toString())}");${builder.newLineChar}`);

  // Parse headers
  parseHeader(builder, request.toJSON());

  // Configure the body
  parseBody(builder, request);
  builder.appendLine('var response = await client.SendAsync(request);');
  builder.appendLine('response.EnsureSuccessStatusCode();');
  builder.appendLine('Console.WriteLine(await response.Content.ReadAsStringAsync());');
}

/**
 * Used in order to get additional options for generation of C# code snippet (i.e. Include Boilerplate code)
 *
 * @module getOptions
 *
 * @returns {Array} Additional options specific to generation of csharp-httpclient code snippet
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
      description: 'Set number of milliseconds the request should wait for a response before timing out ' +
        '(use 0 for infinity)'
    },
    {
      name: 'Follow redirects',
      id: 'followRedirect',
      type: 'boolean',
      description: 'Automatically follow HTTP redirects',
      default: true
    }
  ];
}

/**
 * Converts Postman sdk request object to csharp-httpclient code snippet
 *
 * @module convert
 *
 * @param {Object} request - Postman-SDK request object
 * @param {Object} options - Options to tweak code snippet generated in C#
 * @param {String} options.indentType - type for indentation eg: Space, Tab (default: Space)
 * @param {String} options.indentCount - number of spaces or tabs for indentation. (default: 4 for indentType:
 *                                      Space, default: 1 for indentType: Tab)
 * @param {Boolean} [options.includeBoilerplate] - indicates whether to include class definition in C#
 * @param {Number} options.requestTimeout - time in seconds after which request will bail out
 *                                               (default: 0 -> use .NET default timeout of 100 seconds)
 * @param {Boolean} options.followRedirect - whether to enable follow redirect
 * @param {Function} callback - Callback function with parameters (error, snippet)
 *
 * @returns {String} Generated C# snippet via callback
 */
export function convert(request: Request, options: SnippetOptions, callback: Function): string {
  if (!isFunction(callback)) {
    throw new Error('C#-HttpClient-Converter: Callback is not valid function');
  }

  // String representing value of indentation required
  var indentString,
    codeBuilder;

  options = sanitizeOptions(options, getOptions());

  indentString = options.indentType === 'Tab' ? '\t' : ' ';

  codeBuilder = new CodeBuilder(options.indentCount ?? 2, indentString);

  if (options.includeBoilerplate) {
    codeBuilder.appendLine('// No more boilerplate needed with top level statements ' +
      '(https://docs.microsoft.com/en-us/dotnet/core/tutorials/top-level-templates)');
  }

  makeSnippet(codeBuilder, request, options);

  return callback(null, codeBuilder.build(options.includeBoilerplate));
}
