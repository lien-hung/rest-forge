import { FormParam, HeaderDefinition, PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { isEmpty, forEach, isFunction } from '../../common/lodash';
import { sanitize, getUrlStringfromUrlObject } from './util';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * Parses Raw data from request to fetch syntax
 *
 * @param {Object} body - Raw body data
 * @param {String} mode - Request body type (i.e. raw, urlencoded, formdata, file)
 * @param {boolean} trim - trim body option
 * @returns {String} request body in the desired format
 */
function parseRawBody(body: string, mode: string, trim: boolean): string {
  if (isEmpty(body)) {
    return '';
  }
  var bodySnippet;
  bodySnippet = `let parameters = ${sanitize(body, mode, trim)}\n`;
  bodySnippet += 'let postData = parameters.data(using: .utf8)';
  return bodySnippet;
}

/**
 * Parses URLEncoded body from request to fetch syntax
 *
 * @param {Object} body - URLEncoded Body
 * @param {String} mode - Request body type (i.e. raw, urlencoded, formdata, file)
 * @param {boolean} trim - trim body option
 * @returns {String} request body in the desired format
 */
function parseURLEncodedBody(body: PropertyList<QueryParam> | undefined, mode: string, trim: boolean): string {
  if (!body || isEmpty(body)) {
    return '';
  }
  var payload, bodySnippet;
  payload = body
    .filter((data) => !data.disabled, undefined)
    .map((data) => `${sanitize(data.key, mode, trim)}=${sanitize(data.value, mode, trim)}`)
    .join('&');

  bodySnippet = `let parameters = "${payload}"\n`;
  bodySnippet += 'let postData =  parameters.data(using: .utf8)';
  return bodySnippet;
}

/**
 * Parses formData body from request to fetch syntax
 *
 * @param {Object} body - formData Body
 * @param {String} mode - Request body type (i.e. raw, urlencoded, formdata, file)
 * @param {boolean} trim - trim body option
 * @param {String} indent - indentation string
 * @returns {String} request body in the desired format
 */
function parseFormData(body: PropertyList<FormParam> | undefined, mode: string, trim: boolean, indent: string): string {
  var parameters = new Array<string>(),
    parameter,
    bodySnippet;
  forEach(body?.all() ?? [], (data) => {
    if (!(data.disabled)) {
      parameter = '';
      parameter += `${indent}[\n${indent.repeat(2)}"key": "${sanitize(data.key, mode, trim)}",\n`;
      if (data.type === 'file') {
        parameter += `${indent.repeat(2)}"src": "${sanitize(data.src, mode, trim)}",\n`;
        parameter += `${indent.repeat(2)}"type": "file"\n${indent}]`;
      }
      else {
        parameter += `${indent.repeat(2)}"value": "${sanitize(data.value, mode, trim)}",\n`;
        parameter += `${indent.repeat(2)}"type": "text"`;
        if (data.contentType) {
          parameter += `,\n${indent.repeat(2)}"contentType": "${sanitize(data.contentType, mode, trim)}"`;
        }
        parameter += `\n${indent}]`;
      }
      parameters.push(parameter);
    }
  });

  var parametersStr = `[\n${parameters.join(',\n')}]`;
  bodySnippet = `let parameters = ${parametersStr} as [[String: Any]]\n\n`;
  bodySnippet += 'let boundary = "Boundary-\\(UUID().uuidString)"\n';
  bodySnippet += 'var body = Data()\nvar error: Error? = nil\n';
  bodySnippet += 'for param in parameters {\n';
  bodySnippet += `${indent}if param["disabled"] != nil { continue }\n`;
  bodySnippet += `${indent}let paramName = param["key"]!\n`;
  bodySnippet += `${indent}body += Data("--\\(boundary)\\r\\n".utf8)\n`;
  bodySnippet += `${indent}body += Data("Content-Disposition:form-data; name=\\"\\(paramName)\\"\".utf8)\n`;
  bodySnippet += `${indent}if param["contentType"] != nil {\n`;
  bodySnippet += `${indent.repeat(2)}body += Data("\\r\\nContent-Type: \\(param["contentType"] as! String)".utf8)\n`;
  bodySnippet += `${indent}}\n`;
  bodySnippet += `${indent}let paramType = param["type"] as! String\n`;
  bodySnippet += `${indent}if paramType == "text" {\n`;
  bodySnippet += `${indent.repeat(2)}let paramValue = param["value"] as! String\n`;
  bodySnippet += `${indent.repeat(2)}body += Data("\\r\\n\\r\\n\\(paramValue)\\r\\n".utf8)\n`;
  bodySnippet += `${indent}} else {\n`;
  bodySnippet += `${indent.repeat(2)}let paramSrc = param["src"] as! String\n`;
  bodySnippet += `${indent.repeat(2)}let fileURL = URL(fileURLWithPath: paramSrc)\n`;
  bodySnippet += `${indent.repeat(2)}if let fileContent = try? Data(contentsOf: fileURL) {\n`;
  bodySnippet += `${indent.repeat(3)}body += Data("; filename=\\"\\(paramSrc)\\"\\r\\n".utf8)\n`;
  bodySnippet += `${indent.repeat(3)}body += Data("Content-Type: \\"content-type header\\"\\r\\n".utf8)\n`;
  bodySnippet += `${indent.repeat(3)}body += Data("\\r\\n".utf8)\n`;
  bodySnippet += `${indent.repeat(3)}body += fileContent\n`;
  bodySnippet += `${indent.repeat(3)}body += Data("\\r\\n".utf8)\n`;
  bodySnippet += `${indent.repeat(2)}}\n`;
  bodySnippet += `${indent}}\n`;
  bodySnippet += '}\n';
  bodySnippet += 'body += Data("--\\(boundary)--\\r\\n".utf8);\n';
  bodySnippet += 'let postData = body\n';
  return bodySnippet;
}

/**
 * Parses file body from the Request
 *
 * @returns {String} request body in the desired format
 */
function parseFile(): string {
  var bodySnippet = 'let parameters = "<file contents here>"\n';
  bodySnippet += 'let postData = parameters.data(using: .utf8)';
  return bodySnippet;
}

/**
 * Parses Body from the Request using
 *
 * @param {Object} body - body object from request.
 * @param {boolean} trim - trim body option
 * @param {String} indent - indentation string
 * @returns {String} utility function for getting request body in the desired format
 */
function parseBody(body: RequestBody, trim: boolean, indent: string): string {
  if (!isEmpty(body)) {
    switch (body.mode) {
      case 'urlencoded':
        return parseURLEncodedBody(body.urlencoded, body.mode, trim);
      case 'raw':
        return parseRawBody(String(body.raw), body.mode, trim);
      case 'formdata':
        return parseFormData(body.formdata, body.mode, trim, indent);
      case 'file':
        return parseFile();
      default:
        return '';
    }
  }
  return '';
}

/**
 * Parses headers from the request.
 *
 * @param {Object} headers - headers from the request.
 * @param {String} mode - Request body type (i.e. raw, urlencoded, formdata, file)
 * @returns {String} request headers in the desired format
 */
function parseHeaders(headers: HeaderDefinition[], mode: string): string {
  var headerSnippet = '';
  if (!isEmpty(headers)) {
    headers = headers.filter((header) => !header.disabled);
    forEach(headers, function (header) {
      headerSnippet += `request.addValue("${sanitize(header.value, 'header')}", `;
      headerSnippet += `forHTTPHeaderField: "${sanitize(header.key, 'header', true)}")\n`;
    });
  }
  if (mode === 'formdata') {
    headerSnippet += 'request.addValue("multipart/form-data; ';
    headerSnippet += 'boundary=\\(boundary)", forHTTPHeaderField: "Content-Type")\n';
  }
  return headerSnippet;
}

/**
   * Used in order to get additional options for generation of Swift code snippet
   *
   * @module getOptions
   *
   * @returns {Array} Additional options specific to generation of Swift-URLSession code snippet
   */
export function getOptions(): Array<any> {
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
      name: 'Trim request body fields',
      id: 'trimRequestBody',
      type: 'boolean',
      default: false,
      description: 'Remove white space and additional lines that may affect the server\'s response'
    },
    {
      name: 'Include boilerplate',
      id: 'includeBoilerplate',
      type: 'boolean',
      default: false,
      description: 'Include class definition and import statements in snippet'
    }
  ];
}

/**
   * Converts Postman sdk request object to Swift-URLSession code snippet
   *
   * @module convert
   *
   * @param  {Object} request - Postman SDK-request object
   * @param  {Object} options - Options to tweak code snippet generated in Swift
   * @param  {String} options.indentType - type of indentation eg: Space / Tab (default: Space)
   * @param  {Number} options.indentCount - frequency of indent (default: 4 for indentType: Space,
                                                                   default: 1 for indentType: Tab)
   * @param {Number} options.requestTimeout - time in milli-seconds after which request will bail out
                                               (default: 0 -> never bail out)
   * @param {Boolean} options.trimRequestBody - whether to trim request body fields (default: false)
   * @param {Boolean} options.followRedirect - whether to allow redirects of a request
   * @param  {Function} callback - Callback function with parameters (error, snippet)
   * @returns {String} Generated swift snippet via callback
   */
export function convert(request: Request, options: SnippetOptions, callback: Function): string {
  if (!isFunction(callback)) {
    throw new Error('Swift-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());
  var indent, trim, timeout, finalUrl,
    codeSnippet = '',
    bodySnippet = '',
    headerSnippet = '',
    requestBody;

  indent = options.indentType === 'Tab' ? '\t' : ' ';
  indent = indent.repeat(options.indentCount);
  timeout = options.requestTimeout;
  trim = options.trimRequestBody;
  finalUrl = getUrlStringfromUrlObject(request.url);

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  requestBody = request.body;
  bodySnippet = parseBody(requestBody, trim, indent);

  if (options.includeBoilerplate) {
    codeSnippet += 'import Foundation\n';
    codeSnippet += '#if canImport(FoundationNetworking)\nimport FoundationNetworking\n#endif\n\n';
  }
  if (bodySnippet !== '') {
    codeSnippet += `${bodySnippet}\n\n`;
  }
  codeSnippet += `var request = URLRequest(url: URL(string: "${finalUrl}")!,` +
    `timeoutInterval: ${timeout ? timeout : 'Double.infinity'})\n`;
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
  headerSnippet = parseHeaders(request.toJSON().header ?? [], (request.body ? request.body.mode : 'raw'));
  if (headerSnippet !== '') {
    codeSnippet += headerSnippet + '\n';
  }
  codeSnippet += `request.httpMethod = "${request.method}"\n`;
  if (bodySnippet !== '') {
    codeSnippet += 'request.httpBody = postData\n';
  }
  codeSnippet += '\nlet task = URLSession.shared.dataTask(with: request) { data, response, error in \n';
  codeSnippet += `${indent}guard let data = data else {\n`;
  codeSnippet += `${indent.repeat(2)}print(String(describing: error))\n`;
  codeSnippet += `${indent.repeat(2)}`;
  codeSnippet += options.includeBoilerplate ? 'exit(EXIT_SUCCESS)\n' : 'return\n';
  codeSnippet += `${indent}}\n`;
  codeSnippet += `${indent}print(String(data: data, encoding: .utf8)!)\n`;
  codeSnippet += options.includeBoilerplate ? `${indent}exit(EXIT_SUCCESS)\n` : '';
  codeSnippet += '}\n\n';
  codeSnippet += 'task.resume()\n';
  codeSnippet += options.includeBoilerplate ? 'dispatchMain()\n' : '';

  return callback(null, codeSnippet);
}
