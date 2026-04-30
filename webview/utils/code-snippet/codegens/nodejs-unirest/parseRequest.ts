import { FormParam, PropertyList, QueryParam, Request, RequestBody } from 'postman-collection';
import { isEmpty } from '../../common/lodash';
import { sanitize } from './util';

/**
 * parses body of request when mode of body is formdata and
 * returns code snippet for nodejs to send body
 *
 * @param {Array<Object>} bodyArray - array containing body elements of request
 * @param {String} indentString - string required for indentation
 * @param {Boolean} trimBody - indicates whether to trim body fields or not
 */
function parseMultipart(bodyArray: PropertyList<FormParam> | undefined, indentString: string, trimBody: boolean) {
  if (!bodyArray) {
    return '';
  }

  return bodyArray.all().reduce(function (bodyString, item) {
    if (item.disabled) {
      return bodyString;
    }
    if ('type' in item && item.type === 'file' && 'src' in item && typeof item.src === 'string') {
      bodyString += indentString + `.attach('file', '${sanitize(item.src, trimBody)}')\n`;
    }
    else {
      bodyString += indentString +
        `.field('${sanitize(item.key, trimBody)}', '${sanitize(item.value, trimBody)}')\n`;
    }
    return bodyString;
  }, '');
}

/**
 * parses body of request when mode of body is urlencoded and
 * returns code snippet for nodejs to send body
 *
 * @param {Array<Object>} bodyArray - data containing body elements of request
 * @param {String} indentString - string required for indentation
 * @param {Boolean} trimBody - indicates whether to trim body fields or not
 */
function parseFormdata(bodyArray: PropertyList<QueryParam> | undefined, indentString: string, trimBody: boolean) {
  if (!bodyArray) {
    return '';
  }

  return bodyArray.all().reduce(function (bodyString, item) {
    if (item.disabled) {
      return bodyString;
    }
    bodyString += indentString +
      '.send(' + `'${sanitize(item.key, trimBody)}=${sanitize(item.value, trimBody)}'`.replace(/&/g, '%26') + ')\n';
    return bodyString;
  }, '');
}

/**
 * Parses body object based on mode of body and converts into nodejs(unirest) code snippet
 *
 * @param {Object} requestBody - json object representing body of request
 * @param {String} indentString - string required for indentation
 * @param {Boolean} trimBody - indicates whether to trim body fields or not
 * @param {String} contentType Content type of the body being sent
 * @returns {String} - code snippet for adding body in request
 */
export function parseBody(requestBody: RequestBody, indentString: string, trimBody: boolean, contentType: string): string {
  if (requestBody) {
    switch (requestBody.mode) {
      case 'raw':
        if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
          try {
            let jsonBody = JSON.parse(String(requestBody.raw));
            return `${indentString}.send(JSON.stringify(${JSON.stringify(jsonBody, null,
              indentString.length).replace(/\n/g, '\n' + indentString)}))\n`;
          }
          catch (error) {
            return indentString + '.send(' + JSON.stringify(requestBody.raw) + ')\n';
          }
        }
        return indentString + '.send(' + JSON.stringify(requestBody.raw) + ')\n';
      case 'urlencoded':
        return parseFormdata(requestBody.urlencoded, indentString, trimBody);
      case 'formdata':
        return parseMultipart(requestBody.formdata, indentString, trimBody);
      case 'file':
        return '.send("<file contents here>")\n';
      default:
        return '';
    }
  }
  return '';
}

/**
 * parses header of request object and returns code snippet of nodejs unirest to add header
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required in code snippet
 * @returns {String} - code snippet of nodejs unirest to add header
 */
export function parseHeader(request: Request, indentString: string): string {
  var headerObject = request.getHeaders({ enabled: true }),
    headerSnippet = '';

  if (!isEmpty(headerObject)) {
    headerSnippet += indentString + '.headers({\n';

    headerSnippet += Object.keys(headerObject).reduce(function (accumalator, key) {
      if (Array.isArray(headerObject[key])) {
        var headerValues = headerObject[key].map((value) => `'${sanitize(value)}'`);
        accumalator.push(indentString.repeat(2) + `'${sanitize(key, true)}': [${headerValues.join(', ')}]`);
      }
      else {
        accumalator.push(indentString.repeat(2) + `'${sanitize(key, true)}': '${sanitize(headerObject[key])}'`);
      }
      return accumalator;
    }, new Array<string>()).join(',\n') + '\n';

    headerSnippet += indentString + '})\n';
  }
  return headerSnippet;
}