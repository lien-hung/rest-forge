import { Request, RequestBody } from 'postman-collection';
import { get } from '../../common/lodash';
import { SnippetOptions } from './type';

/**
 * sanitizes input string by handling escape characters eg: converts '''' to '\'\'', (" to \"  and \ to \\ )
 * and trim input if required
 *
 * @param {String} inputString
 * @param {Boolean} [trim] - indicates whether to trim string or not
 * @param {String} [quoteType] - indicates which quoteType has to be escaped
 * @param {Boolean} [backSlash] - indicates whether to escape backslash(\\)
 * @param {Boolean} [urlEncode] - indicates whether to url-encode inputString
 * @returns {String}
 */
export function sanitize(inputString: string, trim: boolean, quoteType?: string, backSlash: boolean = false, urlEncode: boolean = false): string {
  if (typeof inputString !== 'string') {
    return '';
  }

  if (urlEncode) {
    inputString = encodeURIComponent(inputString);
  }

  if (backSlash) {
    inputString = inputString.replace(/\\/g, '\\\\');
  }

  if (quoteType === '"') {
    inputString = inputString.replace(/"/g, '\\"');
    // Escape backslash if double quote was already escaped before call to sanitize
    inputString = inputString.replace(/(?<!\\)\\\\"/g, '\\\\\\"');

    // Escape special characters to preserve their literal meaning within double quotes
    inputString = inputString
      .replace(/`/g, '\\`')
      .replace(/#/g, '\\#')
      .replace(/\$/g, '\\$')
      .replace(/!/g, '\\!');
  }
  else if (quoteType === '\'') {
    // for curl escaping of single quotes inside single quotes involves changing of ' to '\''
    inputString = inputString.replace(/'/g, "'\\''");
  }

  return trim ? inputString.trim() : inputString;
}

export function form(option: string, format?: boolean) {
  if (format) {
    switch (option) {
      case '-s':
        return '--silent';
      case '-L':
        return '--location';
      case '-m':
        return '--max-time';
      case '-I':
        return '--head';
      case '-X':
        return '--request';
      case '-H':
        return '--header';
      case '-d':
        return '--data';
      case '-F':
        return '--form';
      case '-g':
        return '--globoff';
      default:
        return '';
    }
  }
  else {
    return option;
  }
}

/**
 * Generates args required for NTLM authentication to happen
 *
 * @param {*} auth - The request sdk request.auth object
 * @param {string} quoteType - user provided option to decide whether to use single or double quotes
 * @param {boolean} format - user provided option to decide whether to use long format or not
 * @returns {string} - The string to be added if NTLM auth is required
 */
export function getNtlmAuthInfo(auth: any, quoteType: string, format: boolean): string {
  const ntlmAuth = auth && auth.ntlm;

  if (!auth || auth.type !== 'ntlm' || !ntlmAuth || !ntlmAuth.count || !ntlmAuth.count()) {
    return '';
  }

  const username = ntlmAuth.has('username') && ntlmAuth.get('username'),
    password = ntlmAuth.has('password') && ntlmAuth.get('password'),
    domain = ntlmAuth.has('domain') && ntlmAuth.get('domain');

  if (!username && !password) {
    return '';
  }

  var userArg = format ? '--user ' : '-u ',
    ntlmString = ' --ntlm ' + userArg + quoteType;

  if (domain) {
    ntlmString += sanitize(domain, true, quoteType) + '\\';
  }
  ntlmString += sanitize(username, true, quoteType) + ':' + sanitize(password, true, quoteType);
  ntlmString += quoteType;

  return ntlmString;
}

/**
 *
 * @param {*} urlObject The request sdk request.url object
 * @param {String} quoteType The user given quoteType
 * @returns {String} The final string after parsing all the parameters of the url including
 * protocol, auth, host, port, path, query, hash
 * This will be used because the url.toString() method returned the URL with non encoded query string
 * and hence a manual call is made to getQueryString() method with encode option set as true.
 */
export function getUrlStringfromUrlObject(urlObject: any, quoteType: string): string {
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

  return sanitize(url, false, quoteType);
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
export function encodeParam(param: string | null): string {
  if (!param) {
    return '';
  }
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
*
* @param {Array} array - form data array
* @param {String} key - key of form data param
* @param {String} type - type of form data param(file/text)
* @param {String} val - value/src property of form data param
* @param {String} disabled - Boolean denoting whether the param is disabled or not
* @param {String} contentType - content type header of the param
*
* Appends a single param to form data array
*/
export function addFormParam(array: Array<any>, key: string, type: string, val: string, disabled: string, contentType: string) {
  if (type === 'file') {
    array.push({
      key: key,
      type: type,
      src: val,
      disabled: disabled,
      contentType: contentType
    });
  }
  else {
    array.push({
      key: key,
      type: type,
      value: val,
      disabled: disabled,
      contentType: contentType
    });
  }
}

/**
 * @param {Object} body
 * @returns {boolean}
 *
 * Determines if a request body is actually empty.
 * This is needed because body.isEmpty() returns false for formdata
 * and urlencoded when they contain only disabled params which will not
 * be a part of the curl request.
 */
export function isBodyEmpty(body: RequestBody): boolean {
  if (!body) {
    return true;
  }

  if (body.isEmpty()) {
    return true;
  }

  if (body.mode === 'formdata' || body.mode === 'urlencoded') {
    let memberCount = 0;
    body[body.mode] && body[body.mode]?.all().length && body[body.mode]?.all().forEach((param) => {
      if (!param.disabled) {
        memberCount += 1;
      }
    });

    return memberCount === 0;
  }

  return false;
}

/**
 * Decide whether we should add the HTTP method explicitly to the cURL command.
 *
 * @param {Object} request
 * @param {Object} options
 *
 * @returns {Boolean}
 */
export function shouldAddHttpMethod(request: Request, options: SnippetOptions): boolean {
  let followRedirect = options.followRedirect,
    followOriginalHttpMethod = options.followOriginalHttpMethod,
    disableBodyPruning = true,
    isEmpty = request.body ? isBodyEmpty(request.body) : false;

  if ('protocolProfileBehavior' in request && request.protocolProfileBehavior) {
    followRedirect = get(request, 'protocolProfileBehavior.followRedirects', followRedirect);
    followOriginalHttpMethod =
      get(request, 'protocolProfileBehavior.followOriginalHttpMethod', followOriginalHttpMethod);
    disableBodyPruning = get(request, 'protocolProfileBehavior.disableBodyPruning', true);
  }

  if (followRedirect && followOriginalHttpMethod) {
    return true;
  }

  switch (request.method) {
    case 'HEAD':
      return false;
    case 'GET':
      // disableBodyPruning will generally not be present in the request
      // the only time it will be present, its value will be _false_
      // i.e. the user wants to prune the request body despite it being present
      return !isEmpty && disableBodyPruning;
    case 'POST':
      return isEmpty;
    case 'DELETE':
    case 'PUT':
    case 'PATCH':
    default:
      return true;
  }
}
