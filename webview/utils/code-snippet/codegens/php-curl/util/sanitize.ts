import { Url } from 'postman-collection';

/**
* sanitization of values : trim, escape characters
*
* @param {String} inputString - input
* @param {String} escapeCharFor - escape for headers, body: raw, formdata etc
* @param {Boolean} [inputTrim] - whether to trim the input
* @returns {String}
*/
export function sanitize(inputString: string | null | undefined, escapeCharFor: string, inputTrim?: boolean): string {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputTrim && typeof inputTrim === 'boolean' ? inputString.trim() : inputString;
  if (escapeCharFor && typeof escapeCharFor === 'string') {
    switch (escapeCharFor) {
      case 'urlencoded':
        return encodeURIComponent(inputString).replace(/'/g, '\\\'');
      default:
        return inputString.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
    }
  }
  return inputString;
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

  return sanitize(url, '');
}

/**
 * @param {Object} urlObject
 * @returns {String}
 */
function getQueryString(urlObject: Url): string {
  let isFirstParam = true,
    params = urlObject.query.all(),
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

      result += encodeParam(param.key ?? '') + '=' + encodeParam(param.value ?? '');
    });
  }

  return result;
}

/**
 * Encode param except the following characters- [,{,},],%
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