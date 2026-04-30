import { Url } from 'postman-collection';
import { get } from '../../common/lodash';

/**
 * sanitizes input string by handling escape characters eg: converts '''' to '\'\''
 * and trim input if required
 *
 * @param {String} inputString
 * @param {Boolean} [trim] - indicates whether to trim string or not
 * @returns {String}
 */
export function sanitize(inputString?: string, trim?: boolean): string {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString.replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return trim ? inputString.trim() : inputString;

}

/**
 * sanitizes input string by handling escape characters eg: converts '''' to '\'\''
 * and trim input if required
 *
 * @param {String} inputString
 * @param {Boolean} [trim] - indicates whether to trim string or not
 * @returns {String}
 */
export function sanitizeMultiline(inputString: string, trim: boolean): string {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString
    .replace(/`/g, '`+"`"+`')
    .replace(/\r/g, '`+"\r"+`'); // Go discards \r from raw strings, so manually keep them
  return trim ? inputString.trim() : inputString;
}

/**
 *
 * @param {Object} urlObject The request sdk request.url object
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

  return sanitize(url, false);
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
 * Encode param except the following characters- [,{,},],%,+
 *
 * @param {String} param
 * @returns {String}
 */
export function encodeParam(param: string): string {
  return encodeURIComponent(param)
    .replace(/%5B/g, '[')
    .replace(/%7B/g, '{')
    .replace(/%5D/g, ']')
    .replace(/%7D/g, '}')
    .replace(/%2B/g, '+')
    .replace(/%25/g, '%')
    .replace(/'/g, '%27');
}