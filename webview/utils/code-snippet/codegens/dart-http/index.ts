import { FormParamDefinition, QueryParamDefinition, Request, RequestBody, RequestBodyDefinition } from 'postman-collection';
import { isEmpty, forEach, isFunction } from '../../common/lodash';
import { sanitize } from './util';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * Parses Url encoded data
 *
 * @param {Object} body body data
 * @param {String} indent indentation required for code snippet
 * @param {Boolean} trim indicates whether to trim string or not
 */
function parseUrlEncoded(body: QueryParamDefinition[], indent: string, trim: boolean) {
  var bodySnippet = 'request.bodyFields = {',
    enabledBodyList = body.filter((param) => !param.disabled),
    bodyDataMap;
  if (!isEmpty(enabledBodyList)) {
    bodyDataMap = enabledBodyList.map((param) => `${indent}'${sanitize(param.key, trim)}': '${sanitize(param.value, trim)}'`);
    bodySnippet += '\n' + bodyDataMap.join(',\n') + '\n';
  }
  bodySnippet += '};';
  return bodySnippet;
}

/**
 * Parses Raw data
 *
 * @param {Object} body Raw body data
 * @param {Boolean} trim indicates whether to trim string or not
 * @param {String} contentType the content-type of request body
 * @param {Integer} indentCount the number of space to use
 */
function parseRawBody(body: string, trim: boolean, contentType: string, indentCount: number) {
  if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
    try {
      let jsonBody = JSON.parse(body);
      return `request.body = json.encode(${JSON.stringify(jsonBody, null, indentCount)});`;

    }
    catch (error) {
      // Do nothing
    }
  }
  return `request.body = '''${sanitize(body, trim)}''';`;
}

/**
 * Parses form data body from request
 *
 * @param {Object} body form data Body
 * @param {String} indent indentation required for code snippet
 * @param {Boolean} trim indicates whether to trim string or not
 */
function parseFormData(body: FormParamDefinition[], indent: string, trim: boolean) {
  let bodySnippet = '',
    formDataArray = new Array<string>(),
    formDataFileArray = new Array<string>(),
    key,
    value;

  if (isEmpty(body)) {
    return bodySnippet;
  }

  forEach(body, function (data) {
    key = trim ? data.key.trim() : data.key;
    value = trim ? data.value.trim() : data.value;
    if (!data.disabled) {
      if (data.type === 'file') {
        formDataFileArray.push(`request.files.add(await http.MultipartFile.fromPath('${key}', '${data.src}'));`);
      }
      else {
        formDataArray.push(`${indent}'${sanitize(key)}': '${sanitize(value, trim)}'`);
      }
    }
  });

  if (formDataArray.length > 0) {
    bodySnippet += 'request.fields.addAll({\n';
    bodySnippet += formDataArray.join(',\n');
    bodySnippet += '\n});\n';
  }

  if (formDataFileArray.length > 0) {
    bodySnippet += formDataFileArray.join('\n');
  }

  return bodySnippet;
}

/**
 * Parses Body from the Request
 *
 * @param {Object} body body object from request.
 * @param {String} indent indentation required for code snippet
 * @param {Boolean} trim indicates whether to trim string or not
 * @param {String} contentType the content-type of the request body
 */
function parseBody(body: RequestBodyDefinition, indent: string, trim: boolean, contentType: string) {
  if (!isEmpty(body)) {
    switch (body.mode) {
      case 'urlencoded':
        if (!body.urlencoded || typeof body.urlencoded === 'string') {
          return '';
        }
        return parseUrlEncoded(Array.isArray(body.urlencoded) ? body.urlencoded : body.urlencoded.all(), indent, trim);
      case 'raw':
        return parseRawBody(String(body.raw), trim, contentType, indent.length);
      case 'formdata':
        if (!body.formdata) {
          return '';
        }
        return parseFormData(Array.isArray(body.formdata) ? body.formdata : body.formdata.all(), indent, trim);
      case 'file':
        return 'var data = r\'<file contents here>\';\n';
      default:
        return '';
    }
  }
  return '';
}

/**
 * Parses headers from the request.
 *
 * @param {Object} headersArray array containing headers
 * @param {String} indent indentation required for code snippet
 * @param {Boolean} trim indicates whether to trim string or not
 */
function parseHeaders(headersArray: object, indent: string, trim: boolean) {
  var headerString = '',
    headerDictionary = new Array<string>();
  if (isEmpty(headersArray)) {
    return headerString;
  }

  headerString += 'var headers = {\n';

  forEach(headersArray, function (header) {
    if (!header.disabled) {
      headerDictionary.push(indent + '\'' + header.key + '\': \'' + sanitize(header.value, trim) + '\'');
    }
  });

  headerString += headerDictionary.join(',\n');
  headerString += '\n};\n';

  return headerString;
}

export function convert(request: Request, options: SnippetOptions, callback: Function) {
  var indent,
    codeSnippet = '',
    headerSnippet = '',
    footerSnippet = '',
    trim,
    timeout,
    followRedirect,
    contentType;
  options = sanitizeOptions(options, getOptions());

  trim = options.trimRequestBody;
  indent = options.indentType === 'Tab' ? '\t' : ' ';
  indent = indent.repeat(options.indentCount);
  timeout = options.requestTimeout;
  followRedirect = options.followRedirect;

  if (!isFunction(callback)) {
    throw new Error('Callback is not valid function');
  }

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

  contentType = request.headers.get('Content-Type');
  if (options.includeBoilerplate) {
    if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
      headerSnippet = 'import \'dart:convert\';\n';
    }
    headerSnippet += 'import \'package:http/http.dart\' as http;\n\n';
    headerSnippet += 'void main() async {\n';
    footerSnippet = '}\n';
  }

  request.body = solveMultiFile(request.body ?? <RequestBody>{});

  const headers = parseHeaders(request.headers.toJSON(), indent, trim),
    requestBody = request.body ? request.body.toJSON() : <RequestBodyDefinition>{},
    body = parseBody(requestBody, indent, trim, contentType) + '\n';

  codeSnippet += headers;

  if (requestBody && requestBody.mode === 'formdata') {
    codeSnippet += `var request = http.MultipartRequest('${request.method.toUpperCase()}',` +
      ` Uri.parse('${request.url.toString()}'));\n`;
  }
  else {
    codeSnippet += `var request = http.Request('${request.method.toUpperCase()}',` +
      ` Uri.parse('${request.url.toString()}'));\n`;
  }

  if (body !== '') {
    codeSnippet += body;
  }
  if (headers !== '') {
    codeSnippet += 'request.headers.addAll(headers);\n';
  }
  if (!followRedirect) {
    codeSnippet += 'request.followRedirects = false;\n';
  }

  codeSnippet += '\n';

  codeSnippet += 'http.StreamedResponse response = await request.send()';
  if (timeout > 0) {
    codeSnippet += `.timeout(Duration(milliseconds: ${timeout}))`;
  }
  codeSnippet += ';\n\n';
  codeSnippet += 'if (response.statusCode == 200) {\n';
  codeSnippet += `${indent}print(await response.stream.bytesToString());\n`;
  codeSnippet += '}\nelse {\n';
  codeSnippet += `${indent}print(response.reasonPhrase);\n`;
  codeSnippet += '}\n';

  //  if boilerplate is included then two more indent needs to be added in snippet
  (options.includeBoilerplate) &&
    (codeSnippet = indent + codeSnippet.split('\n').join('\n' + indent) + '\n');

  callback(null, headerSnippet + codeSnippet + footerSnippet);
}

export function getOptions() {
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
