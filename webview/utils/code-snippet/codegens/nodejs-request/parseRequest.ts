import { FormParam, PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { forEach, isEmpty } from '../../common/lodash';
import { sanitize } from './util';
import { sep } from 'path';

/**
 * parses body of request when type of the request body is formdata or urlencoded and
 * returns code snippet for nodejs to add body
 *
 * @param {Array<Object>} dataArray - array containing body elements of request
 * @param {String} indentString - string required for indentation
 * @param {Boolean} trimBody - indicates whether to trim body or not
 */
function extractFormData(dataArray: PropertyList<FormParam> | PropertyList<QueryParam> | undefined, indentString: string, trimBody: boolean) {
  if (!dataArray) {
    return '';
  }
  var snippetString = dataArray.all().reduce((accumalator, item) => {
    if (item.disabled) {
      return accumalator;
    }
    if ('type' in item && item.type === 'file' && 'src' in item) {
      if (Array.isArray(item.src) && item.src.length) {
        let fileSnippet = '',
          fileArray = new Array<string>();
        forEach(item.src, (filePath) => {
          fileArray.push(`${indentString.repeat(3)}fs.createReadStream('${sanitize(filePath, trimBody)}')`);
        });
        if (fileArray.length) {
          fileSnippet += `${indentString.repeat(2)}'${sanitize(item.key, trimBody)}': ` +
            `[\n${fileArray.join(',\n')}\n${indentString.repeat(2)}]`;
          accumalator.push(fileSnippet);
        }
        else {
          return accumalator;
        }
      }
      else if (typeof item.src !== 'string') {
        accumalator.push([
          indentString.repeat(2) + `'${sanitize(item.key, trimBody)}': {`,
          indentString.repeat(3) + '\'value\': fs.createReadStream(\'/path/to/file\'),',
          indentString.repeat(3) + '\'options\': {',
          indentString.repeat(4) + '\'filename\': \'filename\'',
          indentString.repeat(4) + '\'contentType\': null',
          indentString.repeat(3) + '}',
          indentString.repeat(2) + '}'
        ].join('\n'));
      }
      else {
        var pathArray = item.src.split(sep),
          fileName = pathArray[pathArray.length - 1];
        accumalator.push([
          indentString.repeat(2) + `'${sanitize(item.key, trimBody)}': {`,
          indentString.repeat(3) + `'value': fs.createReadStream('${sanitize(item.src, trimBody)}'),`,
          indentString.repeat(3) + '\'options\': {',
          indentString.repeat(4) + `'filename': '${sanitize(fileName, trimBody)}',`,
          indentString.repeat(4) + '\'contentType\': null',
          indentString.repeat(3) + '}',
          indentString.repeat(2) + '}'
        ].join('\n'));
      }
    }
    else {
      accumalator.push(
        indentString.repeat(2) +
        `'${sanitize(item.key, trimBody)}': '${sanitize(item.value, trimBody)}'`
      );
    }
    return accumalator;
  }, new Array<string>());
  return snippetString.join(',\n') + '\n';
}

/**
 * Parses body object based on mode of body and returns code snippet
 *
 * @param {Object} requestBody - json object for body of request
 * @param {String} indentString - string for indentation
 * @param {Boolean} trimBody - indicates whether to trim body fields or not
 * @param {String} contentType Content type of the body being sent
 */
export function parseBody(requestBody: RequestBody, indentString: string, trimBody: boolean, contentType: string) {
  if (requestBody) {
    switch (requestBody.mode) {
      case 'raw':
        if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
          try {
            let jsonBody = JSON.parse(String(requestBody.raw));
            return `body: JSON.stringify(${JSON.stringify(jsonBody, null,
              indentString.length).replace(/\n/g, '\n' + indentString)})\n`;
          }
          catch (error) {
            return `body: '${sanitize(requestBody.raw)}'\n`;
          }
        }
        return `body: '${sanitize(requestBody.raw)}'\n`;
      case 'formdata':
        return `formData: {\n${extractFormData(requestBody.formdata, indentString, trimBody)}` +
          indentString + '}';
      case 'urlencoded':
        return `form: {\n${extractFormData(requestBody.urlencoded, indentString, trimBody)}` +
          indentString + '}';
      case 'file':
        return 'body: "<file contents here>"\n';
      default:
        return '';
    }
  }
  return '';
}

/**
 * parses header of request object and returns code snippet of nodejs request to add header
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required in code snippet
 * @returns {String} - code snippet of nodejs request to add header
 */
export function parseHeader(request: Request, indentString: string): string {
  var headerObject = request.getHeaders({ enabled: true }),
    headerSnippet = indentString + '\'headers\': {\n';

  if (!isEmpty(headerObject)) {
    headerSnippet += Object.keys(headerObject).map((key) => {
      if (Array.isArray(headerObject[key])) {
        var headerValues = headerObject[key].map((value) => `'${sanitize(value)}'`);
        return indentString.repeat(2) + `'${sanitize(key, true)}': [${headerValues.join(', ')}]`;
      } else {
        return indentString.repeat(2) + `'${sanitize(key, true)}': '${sanitize(headerObject[key])}'`;
      }
    }).join(',\n') + '\n';
  }

  headerSnippet += indentString + '}';
  return headerSnippet;
}
