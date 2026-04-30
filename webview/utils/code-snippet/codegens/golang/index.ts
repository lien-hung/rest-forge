import { FormParamDefinition, HeaderDefinition, QueryParamDefinition, Request, RequestBody, RequestBodyDefinition } from 'postman-collection';
import { forEach, isEmpty, isFunction } from '../../common/lodash';
import { sanitize, sanitizeMultiline, getUrlStringfromUrlObject } from './util';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';
import { FormField } from '../../common/type';
var isFile = false;

/**
 * Parses Raw data to fetch syntax
 *
 * @param {Object} body Raw body data
 * @param {boolean} trim trim body option
 */
function parseRawBody(body: string, trim: boolean) {
  var bodySnippet = `payload := strings.NewReader(\`${sanitizeMultiline(body.toString(), trim)}\`)`;
  return bodySnippet;
}

/**
 * Parses URLEncoded body from request to fetch syntax
 *
 * @param {Object} body URLEncoded Body
 * @param {boolean} trim trim body option
 */
function parseURLEncodedBody(body: QueryParamDefinition[]) {
  var payload, bodySnippet;
  payload = body.map((param) => `${encodeURIComponent(String(param.key))}=${encodeURIComponent(String(param.key))}`).join('&');
  bodySnippet = `payload := strings.NewReader("${payload}")`;
  return bodySnippet;
}

/**
 * Parses formData body from request to fetch syntax
 *
 * @param {Object} body formData Body
 * @param {boolean} trim trim body option
 * @param {string} indent indent string
 */
function parseFormData(body: FormParamDefinition[], trim: boolean, indent: string) {
  var bodySnippet = `payload := &bytes.Buffer{}\n${indent}writer := multipart.NewWriter(payload)\n`;
  forEach(body, function (data: FormField, index) {
    if (!data.disabled) {
      index = Number(index);
      if (data.type === 'file') {
        isFile = true;
        bodySnippet += `${indent}file, errFile${index + 1} := os.Open("${data.src}")\n`;
        bodySnippet += `${indent}defer file.Close()\n`;
        bodySnippet += `${indent}part${index + 1},
         errFile${index + 1} := writer.CreateFormFile("${sanitize(data.key, trim)}",` +
          `filepath.Base("${data.src}"))\n`;
        bodySnippet += `${indent}_, errFile${index + 1} = io.Copy(part${index + 1}, file)\n`;
        bodySnippet += `${indent}if errFile${index + 1} != nil {` +
          `\n${indent.repeat(2)}fmt.Println(errFile${index + 1})\n` +
          `${indent.repeat(2)}return\n${indent}}\n`;
      }
      else if (data.contentType) {
        bodySnippet += `\n${indent}mimeHeader${index + 1} := make(map[string][]string)\n`;
        bodySnippet += `${indent}mimeHeader${index + 1}["Content-Disposition"] = `;
        bodySnippet += `append(mimeHeader${index + 1}["Content-Disposition"], "form-data; `;
        bodySnippet += `name=\\"${sanitize(data.key, trim)}\\"")\n`;
        bodySnippet += `${indent}mimeHeader${index + 1}["Content-Type"] = append(`;
        bodySnippet += `mimeHeader${index + 1}["Content-Type"], "${data.contentType}")\n`;
        bodySnippet += `${indent}fieldWriter${index + 1}, _ := writer.CreatePart(mimeHeader${index + 1})\n`;
        bodySnippet += `${indent}fieldWriter${index + 1}.Write([]byte("${sanitize(data.value, trim)}"))\n\n`;
      }
      else {
        bodySnippet += `${indent}_ = writer.WriteField("${sanitize(data.key, trim)}",`;
        bodySnippet += ` "${sanitize(data.value, trim)}")\n`;
      }
    }
  });
  bodySnippet += `${indent}err := writer.Close()\n${indent}if err != nil ` +
    `{\n${indent.repeat(2)}fmt.Println(err)\n` +
    `${indent.repeat(2)}return\n${indent}}\n`;
  return bodySnippet;
}

/**
 * Parses file body from the Request
 */
function parseFile() {
  var bodySnippet = 'payload := strings.NewReader("<file contents here>")\n';
  return bodySnippet;
}

/**
 * Parses Body from the Request
 *
 * @param {Object} body body object from request.
 * @param {boolean} trim trim body option
 * @param {string} indent indent string
 */
function parseBody(body: RequestBodyDefinition, trim: boolean, indent: string) {
  if (!isEmpty(body)) {
    switch (body.mode) {
      case 'urlencoded':
        if (!body.urlencoded || typeof body.urlencoded === 'string') {
          return '';
        }
        return parseURLEncodedBody(Array.isArray(body.urlencoded) ? body.urlencoded : body.urlencoded.all());
      case 'raw':
        return parseRawBody(String(body.raw), trim);
      case 'formdata':
        if (!body.formdata) {
          return '';
        }
        return parseFormData(Array.isArray(body.formdata) ? body.formdata : body.formdata.all(), trim, indent);
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
 * @param {Object} headers headers from the request.
 * @param {string} indent indent string
 */
function parseHeaders(headers: HeaderDefinition[], indent: string) {
  var headerSnippet = '';
  if (!isEmpty(headers)) {
    headers = headers.filter((header) => !header.disabled);
    forEach(headers, function (header) {
      headerSnippet += `${indent}req.Header.Add("${sanitize(header.key, true)}", "${sanitize(header.value)}")\n`;
    });
  }
  return headerSnippet;
}

export function convert(request: Request, options: SnippetOptions, callback: Function) {
  if (!isFunction(callback)) {
    throw new Error('GoLang-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());

  var codeSnippet, indent, trim, timeout, followRedirect,
    bodySnippet = '',
    responseSnippet = '',
    headerSnippet = '';

  indent = options.indentType === 'Tab' ? '\t' : ' ';
  indent = indent.repeat(options.indentCount);
  timeout = options.requestTimeout;
  followRedirect = options.followRedirect;
  trim = options.trimRequestBody;

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  if (request.body) {
    bodySnippet = parseBody(request.body.toJSON(), trim, indent);
  }

  codeSnippet = 'package main\n\n';
  codeSnippet += `import (\n${indent}"fmt"\n`;
  if (timeout > 0) {
    codeSnippet += `${indent}"time"\n`;
  }
  if (request.body && request.body.toJSON().mode === 'formdata') {
    codeSnippet += `${indent}"bytes"\n${indent}"mime/multipart"\n`;
  }
  else if (bodySnippet !== '') {
    codeSnippet += `${indent}"strings"\n`;
  }
  if (isFile) {
    codeSnippet += `${indent}"os"\n${indent}"path/filepath"\n`;

    // Setting isFile as false for further calls to this function
    isFile = false;
  }
  codeSnippet += `${indent}"net/http"\n${indent}"io"\n)\n\n`;

  codeSnippet += `func main() {\n\n${indent}url := "${getUrlStringfromUrlObject(request.url)}"\n`;
  codeSnippet += `${indent}method := "${request.method}"\n\n`;

  if (bodySnippet !== '') {
    codeSnippet += indent + bodySnippet + '\n\n';
  }

  if (timeout > 0) {
    codeSnippet += `${indent}timeout := time.Duration(${timeout / 1000} * time.Second)\n`;
  }

  codeSnippet += indent + 'client := &http.Client {\n';
  if (!followRedirect) {
    codeSnippet += indent.repeat(2) + 'CheckRedirect: func(req *http.Request, via []*http.Request) ';
    codeSnippet += 'error {\n';
    codeSnippet += `${indent.repeat(3)}return http.ErrUseLastResponse\n${indent.repeat(2)}},\n`;
  }
  if (timeout > 0) {
    codeSnippet += indent.repeat(2) + 'Timeout: timeout,\n';
  }
  codeSnippet += indent + '}\n';
  if (bodySnippet !== '') {
    codeSnippet += `${indent}req, err := http.NewRequest(method, url, payload)\n\n`;
  }
  else {
    codeSnippet += `${indent}req, err := http.NewRequest(method, url, nil)\n\n`;
  }
  codeSnippet += `${indent}if err != nil {\n${indent.repeat(2)}fmt.Println(err)\n`;
  codeSnippet += `${indent.repeat(2)}return\n${indent}}\n`;
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
  headerSnippet = parseHeaders(request.toJSON().header ?? [], indent);
  if (headerSnippet !== '') {
    codeSnippet += headerSnippet + '\n';
  }
  if (request.body && (request.body.toJSON().mode === 'formdata')) {
    codeSnippet += `${indent}req.Header.Set("Content-Type", writer.FormDataContentType())\n`;
  }
  responseSnippet = `${indent}res, err := client.Do(req)\n`;
  responseSnippet += `${indent}if err != nil {\n${indent.repeat(2)}fmt.Println(err)\n`;
  responseSnippet += `${indent.repeat(2)}return\n${indent}}\n`;
  responseSnippet += `${indent}defer res.Body.Close()\n\n${indent}body, err := io.ReadAll(res.Body)\n`;
  responseSnippet += `${indent}if err != nil {\n${indent.repeat(2)}fmt.Println(err)\n`;
  responseSnippet += `${indent.repeat(2)}return\n${indent}}\n`;
  responseSnippet += `${indent}fmt.Println(string(body))\n}`;

  codeSnippet += responseSnippet;
  callback(null, codeSnippet);
}

export function getOptions() {
  return [{
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
    description: 'Set number of milliseconds the request should wait for a ' +
      'response before timing out (use 0 for infinity)'
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
  }];
}
