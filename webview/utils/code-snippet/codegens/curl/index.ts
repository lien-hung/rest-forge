import { sanitize, getUrlStringfromUrlObject, getNtlmAuthInfo, form, shouldAddHttpMethod } from './util';
import { isFunction, forEach, isEmpty, includes } from '../../common/lodash';
import { FormParamDefinition, Header, QueryParamDefinition, Request, RequestBody } from 'postman-collection';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';
import { SnippetOptions } from './type';

export function convert(request: Request, options: SnippetOptions, callback: Function) {
  if (!isFunction(callback)) {
    throw new Error('Curl-Converter: callback is not valid function');
  }
  options = sanitizeOptions(options, getOptions());

  var indent: string, trim: boolean, headersData, body, redirect, timeout, multiLine,
    format: boolean, snippet: string, silent, url, quoteType: string, ntlmAuth;

  redirect = options.followRedirect;
  timeout = options.requestTimeoutInSeconds;
  multiLine = options.multiLine;
  format = options.longFormat;
  trim = options.trimRequestBody;
  silent = options.silent;
  quoteType = options.quoteType === 'single' ? '\'' : '"';
  url = getUrlStringfromUrlObject(request.url, quoteType);
  ntlmAuth = getNtlmAuthInfo(request.auth, quoteType, format);

  snippet = 'curl';

  if (ntlmAuth) {
    snippet += ntlmAuth;
  }
  if (silent) {
    snippet += ` ${form('-s', format)}`;
  }
  if (redirect) {
    snippet += ` ${form('-L', format)}`;
  }
  if (timeout > 0) {
    snippet += ` ${form('-m', format)} ${timeout}`;
  }
  if ((url.match(/[{[}\]]/g) || []).length > 0) {
    snippet += ` ${form('-g', format)}`;
  }
  if (multiLine) {
    indent = options.indentType === 'Tab' ? '\t' : ' ';
    indent = ' ' + options.lineContinuationCharacter + '\n' + indent.repeat(options.indentCount ?? 2);
  }
  else {
    indent = ' ';
  }

  if (request.method === 'HEAD') {
    snippet += ` ${form('-I', format)}`;
  }
  if (shouldAddHttpMethod(request, options)) {
    snippet += ` ${form('-X', format)} ${request.method}`;
  }
  snippet += ` ${quoteType + url + quoteType}`;

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
    forEach(headersData, (header: Header) => {
      if (!header.key) {
        return;
      }
      snippet += indent + `${form('-H', format)} ${quoteType}${sanitize(header.key, true, quoteType)}`;
      // If the header value is an empty string then add a semicolon after key
      // otherwise the header would be ignored by curl
      if (header.value) {
        snippet += `: ${sanitize(header.value, false, quoteType)}${quoteType}`;
      }
      else {
        snippet += ';' + quoteType;
      }
    });
  }

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  if (request.body) {
    body = request.body.toJSON();

    if (!isEmpty(body)) {
      switch (body.mode) {
        case 'urlencoded':
          forEach(body.urlencoded as QueryParamDefinition[], function (data) {
            if (!data.disabled) {
              snippet += indent + (format ? '--data-urlencode' : '-d');
              snippet += ` ${quoteType}${sanitize(data.key, trim, quoteType, false, true)}=` +
                `${sanitize(data.value, trim, quoteType, false, !format)}${quoteType}`;
            }
          });
          break;
        case 'raw': {
          let rawBody = String(body.raw?.toString()),
            isAsperandPresent = includes(rawBody, '@'),
            // Use the long option if `@` is present in the request body otherwise follow user setting
            optionName = isAsperandPresent ? '--data-raw' : form('-d', format),
            sanitizedBody = sanitize(rawBody, trim, quoteType);

          if (!multiLine) {
            try {
              sanitizedBody = JSON.stringify(JSON.parse(sanitizedBody));
            }
            catch (e) {
              // Do nothing
            }
          }

          snippet += indent + `${optionName} ${quoteType}${sanitizedBody}${quoteType}`;

          break;
        }
        case 'formdata':
          forEach(body.formdata as FormParamDefinition[], function (data) {
            if (!(data.disabled)) {
              if (data.type === 'file') {
                snippet += indent + `${form('-F', format)}`;
                snippet += ` ${quoteType}${sanitize(data.key, trim, quoteType)}=` +
                  `${sanitize(`@"${sanitize(data.src, trim, '"', true)}"`, trim, quoteType, quoteType === '"')}`;
                snippet += quoteType;
              }
              else {
                snippet += indent + `${form('-F', format)}`;
                snippet += ` ${quoteType}${sanitize(data.key, trim, quoteType)}=` +
                  sanitize(`"${sanitize(data.value, trim, '"', true)}"`, trim, quoteType, quoteType === '"');
                if ('contentType' in data) {
                  snippet += `;type=${data.contentType}`;
                }
                snippet += quoteType;
              }
            }
          });
          break;
        case 'file':
          const file = body.file as { src: string };
          snippet += indent + (format ? '--data-binary' : '-d');
          snippet += ` ${quoteType}@${sanitize(file.src, trim)}${quoteType}`;
          break;
        default:
          snippet += `${form('-d', format)} ${quoteType}${quoteType}`;
      }
    }
  }

  callback(null, snippet);
}

export function getOptions() {
  return [
    {
      name: 'Generate multiline snippet',
      id: 'multiLine',
      type: 'boolean',
      default: true,
      description: 'Split cURL command across multiple lines'
    },
    {
      name: 'Use long form options',
      id: 'longFormat',
      type: 'boolean',
      default: true,
      description: 'Use the long form for cURL options (--header instead of -H)'
    },
    {
      name: 'Line continuation character',
      id: 'lineContinuationCharacter',
      availableOptions: ['\\', '^', '`'],
      type: 'enum',
      default: '\\',
      description: 'Set a character used to mark the continuation of a statement on the next line ' +
        '(generally, \\ for OSX/Linux, ^ for Windows cmd and ` for Powershell)'
    },
    {
      name: 'Quote Type',
      id: 'quoteType',
      availableOptions: ['single', 'double'],
      type: 'enum',
      default: 'single',
      description: 'String denoting the quote type to use (single or double) for URL ' +
        '(Use double quotes when running curl in cmd.exe and single quotes for the rest)'
    },
    {
      name: 'Set request timeout (in seconds)',
      id: 'requestTimeoutInSeconds',
      type: 'positiveInteger',
      default: 0,
      description: 'Set number of seconds the request should wait for a response before ' +
        'timing out (use 0 for infinity)'
    },
    {
      name: 'Follow redirects',
      id: 'followRedirect',
      type: 'boolean',
      default: true,
      description: 'Automatically follow HTTP redirects'
    },
    {
      name: 'Follow original HTTP method',
      id: 'followOriginalHttpMethod',
      type: 'boolean',
      default: false,
      description: 'Redirect with the original HTTP method instead of the default behavior of redirecting with GET'
    },
    {
      name: 'Trim request body fields',
      id: 'trimRequestBody',
      type: 'boolean',
      default: false,
      description: 'Remove white space and additional lines that may affect the server\'s response'
    },
    {
      name: 'Use Silent Mode',
      id: 'silent',
      type: 'boolean',
      default: false,
      description: 'Display the requested data without showing the cURL progress meter or error messages'
    }
  ];
}
