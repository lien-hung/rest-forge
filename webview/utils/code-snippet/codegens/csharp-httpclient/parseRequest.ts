import { Request, RequestBodyDefinition, RequestDefinition } from 'postman-collection';
import { isEmpty } from '../../common/lodash';
import CodeBuilder from './CodeBuilder';
import { sanitize } from './util';

/**
 * Returns given content type or default if falsey
 *
 * @param {String} contentType
 * @returns {String}
 */
function parseContentType(contentType: string): string {
  return contentType || 'text/plain';
}

/**
 * Parses header in Postman-SDK request and returns code snippet of csharp-httpclient for adding headers
 *
 * @param {Object} builder - Code Builder
 * @param {Object} requestJson - Postman SDK request object
 */
export function parseHeader(builder: CodeBuilder, requestJson: RequestDefinition) {
  if (!Array.isArray(requestJson.header)) {
    return;
  }

  requestJson.header.forEach((header) => {
    if (!header.disabled && sanitize(header.key) !== 'Content-Type') {
      builder.appendLine(`request.Headers.Add("${sanitize(header.key, true)}", "${sanitize(header.value)}");`);
    }
  });
}

function parseFormUrlEncoded(builder: CodeBuilder, requestBody: RequestBodyDefinition) {
  if (isEmpty(requestBody.urlencoded) || typeof requestBody.urlencoded === 'string') {
    return;
  }

  const queryParams = Array.isArray(requestBody.urlencoded) ? requestBody.urlencoded : requestBody.urlencoded?.all();

  let list = queryParams?.reduce((collection: string[], data) => {
    if (data.disabled) {
      return collection;
    }

    (!data.value) && (data.value = '');
    collection.push('collection.Add(new' +
      `("${sanitize(data.key)}", "${sanitize(data.value)}"));`);

    return collection;
  }, []);

  if (list && !isEmpty(list)) {
    builder.appendLine('var collection = new List<KeyValuePair<string, string>>();');
    builder.appendLines(list);
    builder.appendLine('var content = new FormUrlEncodedContent(collection);');
    builder.appendLine('request.Content = content;');
    builder.addUsing('System.Collections.Generic');
  }
}

function addFile(builder: CodeBuilder, key: string, fileSrc: string) {
  builder.appendLine('content.Add(new StreamContent(File.OpenRead' +
    `("${sanitize(fileSrc)}")), "${sanitize(key)}", "${sanitize(fileSrc)}");`);
}

function parseFormData(builder: CodeBuilder, requestBody: RequestBodyDefinition) {
  if (isEmpty(requestBody.formdata)) {
    return;
  }

  const formParams = Array.isArray(requestBody.formdata) ? requestBody.formdata : requestBody.formdata?.all();

  var allDisabled = formParams?.every((i) => i.disabled);
  if (allDisabled) {
    return;
  }

  builder.appendLine('var content = new MultipartFormDataContent();');

  formParams?.forEach((i) => {
    if (i.disabled || !('type' in i)) {
      return;
    }

    if (i.type === 'text') {
      builder.appendLine('content.Add(new StringContent(' +
        `"${sanitize(i.value)}"), "${sanitize(i.key)}");`);
    }
    else if (i.type === 'file' && 'src' in i) {
      if (Array.isArray(i.src)) {
        i.src.forEach((file) => addFile(builder, i.key ?? '', file));
      }
      else if (typeof i.src === 'string') {
        addFile(builder, i.key ?? '', i.src);
      }
    }
  });

  builder.appendLine('request.Content = content;');
}

export function parseBody(builder: CodeBuilder, request: Request) {
  var requestBody = request.body ? request.body.toJSON() : <RequestBodyDefinition>{},
    contentType = request.getHeaders({ enabled: true, ignoreCase: true })['content-type'];
  if (!isEmpty(requestBody)) {
    switch (requestBody.mode) {
      case 'urlencoded':
        parseFormUrlEncoded(builder, requestBody);
        break;
      case 'formdata':
        parseFormData(builder, requestBody);
        break;
      case 'raw':
        builder.appendLine(
          `var content = new StringContent(${JSON.stringify(requestBody.raw)}, null, ` +
          `"${parseContentType(contentType)}");`);
        builder.appendLine('request.Content = content;');
        break;
      case 'file':
        builder
          .appendLine('request.Content = new StreamContent(File.OpenRead("' +
            `${sanitize(request.body?.file?.src || '"<File path>"')}"));`);
        builder.addUsing('System.IO');
        break;
      default:
    }
  }
  else if (contentType) {
    builder.appendLine('var content = new StringContent(string.Empty);');
    builder.appendLine('content.Headers.ContentType = new MediaTypeHeaderValue("' +
      `${contentType}");`);
    builder.addUsing('System.Net.Http.Headers');
    builder.appendLine('request.Content = content;');
  }
}

