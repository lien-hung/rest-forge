import { FormParam, QueryParam, Request } from 'postman-collection';
import { quote } from './sanitize';

const BOUNDARY_HASH = 'e4dgoae5mIkjFjfG',
  URLENCODED = 'urlencoded',
  FORM_DATA = 'formdata',
  RAW = 'raw';

/**
 * Used to parse the body of the postman SDK-request and return in the desired format
 *
 * @param  {Object} request - postman SDK-request object
 * @returns {String} - request body
 */
export const boundaryHash = BOUNDARY_HASH;
export const contentType = '';

export function addHeaders(request: Request) {
  var headerString = '';
  if (request.hasOwnProperty('headers')) {
    let headers = request.headers.all();
    if (Array.isArray(headers) && headers.length) {
      headers = headers.filter((header) => !header.disabled);
      headerString = headers.map((header) => ' ' + header.key.trim() + ':' + quote(header.value)).join(' \\\n');
    }
    else {
      headerString = '';
    }
  }

  return headerString;
}

export function getRequestBody(requestBody: any, contentCategory: string) {
  var parsedBody;

  switch (contentCategory) {
    case URLENCODED:
      if (Array.isArray(requestBody.members) && requestBody.members.length) {
        parsedBody = requestBody.members.map((param: QueryParam) => {
          if (typeof param.value === 'string') {
            return ' ' + quote(param.key) + '=' + quote(param.value);
          }
          return ' ' + param.key + ':=' + param.value;
        }).join(' \\\n');
      }
      else {
        parsedBody = '';
      }
      break;

    case FORM_DATA:
      if (Array.isArray(requestBody.members) && requestBody.members.length) {
        parsedBody = requestBody.members.map((param: FormParam) => {
          if ('type' in param && param.type === 'text') {
            if (typeof param.value === 'string') {
              return ' ' + quote(param.key) + '=' + quote(param.value);
            }
            return ' ' + param.key + ':=' + param.value;
          }
          return ' ' + quote(param.key) + '@' + ('src' in param ? param.src : '');
        }).join(' \\\n');
      }
      else {
        parsedBody = '';
      }
      break;

    case RAW:
      if (requestBody === undefined) {
        parsedBody = '';
      }
      else {
        parsedBody = requestBody ? `${quote(requestBody, RAW)}` : '';
      }
      break;
    case 'file':
      parsedBody = requestBody.src;
      break;
    default:
      parsedBody = '';
  }

  return parsedBody ? parsedBody : '';
}
