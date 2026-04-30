import { FormParam, HeaderDefinition, PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { forEach, isEmpty, isFunction } from '../../common/lodash';
import { sanitize } from './util';
import { SnippetOptions } from './type';
import { sanitizeOptions, solveMultiFile } from '../../common/utils';

/**
 * Parses Raw data
 *
 * @param {Object} body Raw body data
 * @param {Boolean} trim indicates whether to trim string or not
 */
function parseRawBody(body: string, trim: boolean) {
  var bodySnippet = '';
  bodySnippet += 'NSData *postData = [[NSData alloc] initWithData:[@"' + sanitize(body.toString(), trim) + '" ' +
    'dataUsingEncoding:NSUTF8StringEncoding]];\n';
  bodySnippet += '[request setHTTPBody:postData];\n';
  return bodySnippet;
}

/**
 * Parses URLEncoded body
 *
 * @param {Object} body URLEncoded Body
 * @param {Boolean} trim indicates whether to trim string or not
 */
function parseURLEncodedBody(body: PropertyList<QueryParam>, trim: boolean) {
  let bodySnippet = '',
    key,
    value,
    first = true;
  forEach(body.all(), function (data) {
    if (!data.disabled) {
      key = trim ? data.key.trim() : data.key;
      value = trim ? data.value.trim() : data.value;
      if (first) {
        bodySnippet += 'NSMutableData *postData = [[NSMutableData alloc] initWithData:[@"' +
          sanitize(key, true) + '=' + sanitize(value, trim) + '" dataUsingEncoding:NSUTF8StringEncoding]];\n';
      }
      else {
        bodySnippet += '[postData appendData:[@"&' + sanitize(key, true) + '=' + sanitize(value, trim) +
          '" dataUsingEncoding:NSUTF8StringEncoding]];\n';
      }
      first = false;
    }
  });
  bodySnippet += '[request setHTTPBody:postData];\n';
  return bodySnippet;
}

/**
 * Parses form data body from request
 *
 * @param {Object} body form data Body
 * @param {String} indent indentation required for code snippet
 * @param {Boolean} trim indicates whether to trim string or not
 */
function parseFormData(body: PropertyList<FormParam>, indent: string, trim: boolean) {
  let bodySnippet = '',
    formDataArray = new Array<string>(),
    key,
    foundFile = false,
    value;

  if (isEmpty(body)) {
    return bodySnippet;
  }

  bodySnippet += 'NSArray *parameters = @[';

  forEach(body.all(), function (data) {
    key = trim ? data.key.trim() : data.key;
    value = trim ? data.value.trim() : data.value;
    if (!data.disabled) {
      if (data.type === 'file') {
        foundFile = true;
        formDataArray.push(`\n${indent}@{ @"name": @"${key}", @"fileName": @"${data.src}" }`);
      }
      else {
        formDataArray.push(`\n${indent}@{ @"name": @"${key}", @"value": @"${sanitize(value, trim)}" }`);
      }
    }
  });
  bodySnippet += formDataArray.join(', ');
  bodySnippet += ' \n];\n';
  bodySnippet += '\nNSString *boundary = @"----WebKitFormBoundary7MA4YWxkTrZu0gW";\n';
  bodySnippet += 'NSError *error;\n';
  bodySnippet += 'NSMutableString *body = [NSMutableString string];\n';
  bodySnippet += '\nfor (NSDictionary *param in parameters) {\n';
  bodySnippet += indent + '[body appendFormat:@"--%@\\r\\n", boundary];\n';
  if (foundFile) {
    bodySnippet += indent + 'if (param[@"fileName"]) {\n';
    bodySnippet += indent.repeat(2) + '[body appendFormat:@"Content-Disposition:form-data; name=\\"%@\\"; filename=\\"%@\\"\\r\\n", param[@"name"], param[@"fileName"]];\n';
    bodySnippet += indent.repeat(2) + '[body appendFormat:@"Content-Type: %@\\r\\n\\r\\n", param[@"contentType"]];\n';
    bodySnippet += indent.repeat(2) + '[body appendFormat:@"%@", [NSString stringWithContentsOfFile:param[@"fileName"]' +
      ' encoding:NSUTF8StringEncoding error:&error]];\n';
    bodySnippet += indent.repeat(2) + 'if (error) {\n';
    bodySnippet += indent.repeat(3) + 'NSLog(@"%@", error);\n';
    bodySnippet += indent.repeat(2) + '}\n';
    bodySnippet += indent + '} else {\n';
    bodySnippet += indent.repeat(2) +
      '[body appendFormat:@"Content-Disposition:form-data; name=\\"%@\\"\\r\\n\\r\\n", param[@"name"]];\n';
    bodySnippet += indent.repeat(2) + '[body appendFormat:@"%@", param[@"value"]];\n';
    bodySnippet += indent + '}\n';
  }
  else {
    bodySnippet += indent +
      '[body appendFormat:@"Content-Disposition:form-data; name=\\"%@\\"\\r\\n\\r\\n", param[@"name"]];\n';
    bodySnippet += indent + '[body appendFormat:@"%@", param[@"value"]];\n';
  }
  bodySnippet += '}\n';
  bodySnippet += '[body appendFormat:@"\\r\\n--%@--\\r\\n", boundary];\n';
  bodySnippet += 'NSData *postData = [body dataUsingEncoding:NSUTF8StringEncoding];\n';
  bodySnippet += '[request setHTTPBody:postData];\n';
  return bodySnippet;
}

/**
 * Parses Body from the Request
 *
 * @param {Object} body body object from request.
 * @param {String} indent indentation required for code snippet
 * @param {trim} trim indicates whether to trim string or not
 */
function parseBody(body: RequestBody, indent: string, trim: boolean) {
  if (!isEmpty(body)) {
    switch (body.mode) {
      case 'urlencoded':
        return body.urlencoded ? parseURLEncodedBody(body.urlencoded, trim) : '';
      case 'raw':
        return parseRawBody(String(body.raw), trim);
      case 'formdata':
        return body.formdata ? parseFormData(body.formdata, indent, trim) : '';
      case 'file':
        return '';
      default:
        return '<file-content-here>';
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
function parseHeaders(headersArray: HeaderDefinition[], indent: string, trim: boolean) {
  var headerString = '',
    headerDictionary = new Array<string>();
  if (isEmpty(headersArray)) {
    return headerString;
  }
  headerString = 'NSDictionary *headers = @{\n';

  forEach(headersArray, function (header) {
    if (!header.disabled) {
      headerDictionary.push(indent + '@"' + header.key + '": @"' + sanitize(header.value, trim) + '"');
    }
  });
  headerString += headerDictionary.join(',\n');
  headerString += '\n};\n\n';
  headerString += '[request setAllHTTPHeaderFields:headers];\n';
  return headerString;
}

export function convert(request: Request, options: SnippetOptions, callback: Function) {
  var indent,
    codeSnippet = '',
    requestTimeout,
    headerSnippet = '#import <Foundation/Foundation.h>\n\n',
    footerSnippet = '',
    trim;
  options = sanitizeOptions(options, getOptions());
  trim = options.trimRequestBody;
  indent = options.indentType === 'Tab' ? '\t' : ' ';
  indent = indent.repeat(options.indentCount);

  requestTimeout = options.requestTimeout / 1000; // Objective-C takes time in seconds.

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

  request.body = solveMultiFile(request.body ?? <RequestBody>{});
  if (options.includeBoilerplate) {
    headerSnippet += 'int main(int argc, const char * argv[]) {\n\n';
    footerSnippet += '}';
  }
  codeSnippet += 'dispatch_semaphore_t sema = dispatch_semaphore_create(0);\n\n';
  codeSnippet += 'NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"' +
    encodeURI(request.url.toString()) + '"]\n';
  codeSnippet += `${indent}cachePolicy:NSURLRequestUseProtocolCachePolicy\n`;
  codeSnippet += `${indent}timeoutInterval:${requestTimeout}.0];\n`;

  codeSnippet += parseHeaders(request.headers.toJSON(), indent, trim);
  codeSnippet += parseBody(request.body ?? <RequestBody>{}, indent, trim) + '\n';
  codeSnippet += '[request setHTTPMethod:@"' + request.method + '"];\n\n';
  codeSnippet += 'NSURLSession *session = [NSURLSession sharedSession];\n';
  codeSnippet += 'NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:request\n';
  codeSnippet += 'completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {\n';
  codeSnippet += `${indent}if (error) {\n`;
  codeSnippet += `${indent.repeat(2)}NSLog(@"%@", error);\n`;
  codeSnippet += `${indent.repeat(2)}dispatch_semaphore_signal(sema);\n`;
  codeSnippet += `${indent}} else {\n`;
  codeSnippet += `${indent.repeat(2)}NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;\n`;
  codeSnippet += `${indent.repeat(2)}NSError *parseError = nil;\n`;
  codeSnippet += `${indent.repeat(2)}NSDictionary *responseDictionary = [NSJSONSerialization JSONObjectWithData:data options:0 error:&parseError];\n`;
  codeSnippet += `${indent.repeat(2)}NSLog(@"%@",responseDictionary);\n`;
  codeSnippet += `${indent.repeat(2)}dispatch_semaphore_signal(sema);\n`;
  codeSnippet += `${indent}}\n`;
  codeSnippet += '}];\n';
  codeSnippet += '[dataTask resume];\n';
  codeSnippet += 'dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);';

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
      default: 10000,
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
