import { sanitize, getUrlStringfromUrlObject } from './util';
import { isFunction, forEach, isEmpty } from '../../common/lodash';
import { Request, RequestBody } from 'postman-collection';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

export function convert(request: Request, options: SnippetOptions, callback: Function) {
  if (!isFunction(callback)) {
    throw new Error('Curl-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());

  var trim: boolean, headersData, body, text: string[],
    snippet = '',
    formCheck: boolean,
    formdataString = '',
    protocol,
    BOUNDARY = '----WebKitFormBoundary7MA4YWxkTrZu0gW',
    timeout,
    followRedirect,
    indent = options.indentType === 'Tab' ? '\t' : ' ',
    indentString = indent.repeat(options.indentCount),
    headerSnippet = '',
    footerSnippet = '';
  if (options.includeBoilerplate) {
    headerSnippet = '#include <stdio.h>\n#include <string.h>\n#include <curl/curl.h>\n' +
      'int main(int argc, char *argv[]){\n';
    footerSnippet = 'return (int)res;\n}';
  }
  trim = options.trimRequestBody;
  protocol = options.protocol;
  timeout = options.requestTimeout;
  followRedirect = options.followRedirect;
  snippet += 'CURL *curl;\n';
  snippet += 'CURLcode res;\n';
  snippet += 'curl = curl_easy_init();\n';
  snippet += 'if(curl) {\n';
  snippet += indentString + `curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${request.method}");\n`;
  snippet += indentString +
    `curl_easy_setopt(curl, CURLOPT_URL, "${getUrlStringfromUrlObject(request.url)}");\n`;
  if (timeout) {
    snippet += indentString + `curl_easy_setopt(curl, CURLOPT_TIMEOUT_MS, ${timeout}L);\n`;
  }
  if (followRedirect) {
    snippet += indentString + 'curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);\n';
  }
  snippet += indentString + `curl_easy_setopt(curl, CURLOPT_DEFAULT_PROTOCOL, "${protocol}");\n`;
  snippet += indentString + 'struct curl_slist *headers = NULL;\n';
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
  headersData = request.toJSON().header;
  if (headersData) {
    headersData = headersData.filter((header) => !header.disabled);
    forEach(headersData, function (header) {
      snippet += indentString + `headers = curl_slist_append(headers, "${sanitize(header.key, true)}:` +
        ` ${sanitize(header.value)}");\n`;
    });
  }

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  body = request.body ?? <RequestBody>{};
  if (body.mode && body.mode === 'formdata' && !options.useMimeType) {
    snippet += indentString + 'headers = curl_slist_append(headers, "content-type:' +
      ` multipart/form-data; boundary=${BOUNDARY}");\n`;
  }
  snippet += indentString + 'curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);\n';
  if (request.method === 'HEAD') {
    snippet += indentString + 'curl_easy_setopt(curl, CURLOPT_NOBODY, 1L);\n';
  }

  // request body
  if (!isEmpty(body)) {
    switch (body.mode) {
      case 'urlencoded':
        text = [];
        forEach(body.urlencoded ?? [], function (data) {
          if (!data.disabled) {
            text.push(`${encodeURIComponent(data.key)}=${encodeURIComponent(data.value)}`);
          }
        });
        snippet += indentString + `const char *data = "${text.join('&')}";\n`;
        snippet += indentString + 'curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);\n';
        break;
      case 'raw':
        snippet += indentString + `const char *data = "${sanitize(String(body.raw), trim)}";\n`;
        snippet += indentString + 'curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);\n';
        break;
      case 'formdata':
        if (options.useMimeType) {
          snippet += indentString + 'curl_mime *mime;\n';
          snippet += indentString + 'curl_mimepart *part;\n';
          snippet += indentString + 'mime = curl_mime_init(curl);\n';
          snippet += indentString + 'part = curl_mime_addpart(mime);\n';
          formCheck = false;

          forEach(body.formdata?.all() ?? [], function (data) {
            if (!(data.disabled)) {
              if (formCheck) {
                snippet += indentString + 'part = curl_mime_addpart(mime);\n';
              }
              else {
                formCheck = true;
              }
              if (data.type === 'file') {
                snippet += indentString + `curl_mime_name(part, "${sanitize(data.key, trim)}");\n`;
                snippet += indentString + `curl_mime_filedata(part, "${sanitize(data.src, trim)}");\n`;
              }
              else {
                snippet += indentString + `curl_mime_name(part, "${sanitize(data.key, trim)}");\n`;
                if (data.contentType) {
                  snippet += indentString + `curl_mime_type(part, "${sanitize(data.contentType, trim)}");\n`;
                }
                snippet += indentString +
                  `curl_mime_data(part, "${sanitize(data.value, trim)}", CURL_ZERO_TERMINATED);\n`;
              }
            }
          });
          snippet += indentString + 'curl_easy_setopt(curl, CURLOPT_MIMEPOST, mime);\n';
        }
        else {
          BOUNDARY = '--' + BOUNDARY;
          forEach(body.formdata?.all() ?? [], function (data) {
            if (!data.disabled) {
              formdataString += `${BOUNDARY}\\r\\nContent-Disposition: form-data; name=\\"${sanitize(data.key)}\\"`;
              if (data.type === 'file') {
                formdataString += `; filename=\\"${sanitize(data.src)}\\"\\r\\nContent-type: ` +
                  '<Content-Type Header>\\r\\n\\r\\n<file contents here>\\r\\n';
              }
              else {
                formdataString += `\\r\\n\\r\\n${sanitize(data.value)}\\r\\n`;
              }
            }
          });
          formdataString += BOUNDARY + '--';
          snippet += indentString + `curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "${formdataString}");\n`;
        }
        break;
      case 'file':
        snippet += indentString + 'curl_easy_setopt(curl,CURLOPT_POSTFIELDS,"<file contents here>");\n';
        break;
      default:
        snippet = String(snippet);
    }
  }

  snippet += indentString + 'res = curl_easy_perform(curl);\n';
  if (body.mode === 'formdata' && options.useMimeType) {
    snippet += indentString + 'curl_mime_free(mime);\n';
  }
  if (headersData) {
    snippet += indentString + 'curl_slist_free_all(headers);\n';
  }
  snippet += '}\n';
  snippet += 'curl_easy_cleanup(curl);\n';
  (options.includeBoilerplate) &&
    (snippet = indentString + snippet.split('\n').join('\n' + indentString));
  callback(null, headerSnippet + snippet + footerSnippet);
}

export function getOptions() {
  return [
    {
      name: 'Include boilerplate',
      id: 'includeBoilerplate',
      type: 'boolean',
      default: false,
      description: 'Include class definition and import statements in snippet'
    },
    {
      name: 'Protocol',
      id: 'protocol',
      type: 'enum',
      availableOptions: ['http', 'https'],
      default: 'https',
      description: 'The protocol to be used to make the request'
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
    },
    {
      name: 'Use curl_mime',
      id: 'useMimeType',
      type: 'boolean',
      default: true,
      description: 'Use curl_mime to send multipart/form-data requests'
    },
    {
      name: 'Set request timeout',
      id: 'requestTimeout',
      type: 'positiveInteger',
      default: 0,
      description: 'Set number of milliseconds the request should wait for a response' +
        ' before timing out (use 0 for infinity)'
    }
  ];
}
