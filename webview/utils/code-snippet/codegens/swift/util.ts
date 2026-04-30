import { Url } from 'postman-collection';
import { get } from '../../common/lodash';

/**
 * Sanitizes input string by handling escape characters according to request body type
 *
 * @param {String} inputString - Input String to sanitize
 * @param {String} escapeCharFor - Escape character for headers, body: raw, formdata etc.
 * @param {Boolean} [inputTrim] - Indicates whether to trim string or not
 * @returns {String} Sanitized String handling escape characters
 */
export function sanitize(inputString?: string | null, escapeCharFor?: string, inputTrim?: boolean): string {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputTrim && typeof inputTrim === 'boolean' ? inputString.trim() : inputString;
  if (escapeCharFor && typeof escapeCharFor === 'string') {
    switch (escapeCharFor) {
      case 'raw':
        return JSON.stringify(inputString);
      case 'urlencoded':
        return encodeURIComponent(inputString);
      case 'formdata':
        return inputString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      case 'file':
        return inputString.replace(/{/g, '[').replace(/}/g, ']');
      case 'header':
        return inputString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      default:
        return inputString.replace(/"/g, '\\"');
    }
  }
  return inputString;
}

/**
 * Encode param except the following characters- [,{,},],%
 *
 * @param {String} param
 * @returns {String}
 */
function encodeParam(param: string): string {
  return encodeURIComponent(param)
    .replace(/%5B/g, '[')
    .replace(/%7B/g, '{')
    .replace(/%5D/g, ']')
    .replace(/%7D/g, '}')
    .replace(/%2B/g, '+')
    .replace(/%25/g, '%')
    .replace(/'/g, '%27');
}

/**
 * @param {Object} urlObject
 * @returns {String}
 */
export function getQueryString(urlObject: object): string {
  let isFirstParam = true,
    params = get(urlObject, 'query.members'),
    result = '';
  if (Array.isArray(params)) {
    params.forEach((param) => {
      if (param.disabled) {
        return;
      }

      if (isFirstParam) {
        isFirstParam = false;
      } else {
        result += '&';
      }

      result += encodeParam(param.key) + '=' + encodeParam(param.value);
    });
  }

  return result;
}

/**
 *
 * @param {*} urlObject The request sdk request.url object
 * @returns {String} The final string after parsing all the parameters of the url including
 * protocol, auth, host, port, path, query, hash
 * This will be used because the url.toString() method returned the URL with non encoded query string
 * and hence a manual call is made to getQueryString() method with encode option set as true.
 */
export function getUrlStringfromUrlObject(urlObject: Url): string {
  var url = '';
  if (!urlObject) {
    return url;
  }
  if (urlObject.protocol) {
    url += (urlObject.protocol.endsWith('://') ? urlObject.protocol : urlObject.protocol + '://');
  }
  if (urlObject.auth && urlObject.auth.user) {
    url = url + ((urlObject.auth.password) ?
      // ==> username:password@
      urlObject.auth.user + ':' + urlObject.auth.password : urlObject.auth.user) + '@';
  }
  if (urlObject.host) {
    url += urlObject.getHost();
  }
  if (urlObject.port) {
    url += ':' + urlObject.port.toString();
  }
  if (urlObject.path) {
    url += urlObject.getPath();
  }
  if (urlObject.query && urlObject.query.count()) {
    let queryString = getQueryString(urlObject);
    queryString && (url += '?' + queryString);
  }
  if (urlObject.hash) {
    url += '#' + urlObject.hash;
  }

  return sanitize(url, 'url');
}