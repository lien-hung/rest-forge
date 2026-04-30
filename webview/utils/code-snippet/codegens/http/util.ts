import { PropertyList, QueryParam, Request } from 'postman-collection';
import { findIndex, forEach, isEmpty } from '../../common/lodash';
import { sep } from 'path';

const FORM_DATA_BOUNDARY = '----WebKitFormBoundary7MA4YWxkTrZu0gW',
  RAW = 'raw',
  URL_ENCODED = 'urlencoded',
  FORM_DATA = 'formdata',
  FILE = 'file';

var contentTypeHeaderMap = {
  'aac': 'audio/aac',
  'abw': 'application/x-abiword',
  'arc': 'application/x-freearc',
  'avi': 'video/x-msvideo',
  'azw': 'application/vnd.amazon.ebook',
  'bin': 'application/octet-stream',
  'bmp': 'image/bmp',
  'bz': 'application/x-bzip',
  'bz2': 'application/x-bzip2',
  'csh': 'application/x-csh',
  'css': 'text/css',
  'csv': 'text/csv',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'eot': 'application/vnd.ms-fontobject',
  'epub': 'application/epub+zip',
  'gif': 'image/gif',
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/vnd.microsoft.icon',
  'ics': 'text/calendar',
  'jar': 'application/java-archive',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'text/javascript',
  'json': 'application/json',
  'jsonld': 'application/ld+json',
  'mid': 'audio/midi',
  'midi': 'audio/midi',
  'mjs': 'text/javascript',
  'mp3': 'audio/mpeg',
  'mpeg': 'video/mpeg',
  'mpkg': 'application/vnd.apple.installer+xml',
  'odp': 'application/vnd.oasis.opendocument.presentation',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  'odt': 'application/vnd.oasis.opendocument.text',
  'oga': 'audio/ogg',
  'ogv': 'video/ogg',
  'ogx': 'application/ogg',
  'otf': 'font/otf',
  'png': 'image/png',
  'pdf': 'application/pdf',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'rar': 'application/x-rar-compressed',
  'rtf': 'application/rtf',
  'sh': 'application/x-sh',
  'svg': 'image/svg+xml',
  'swf': 'application/x-shockwave-flash',
  'tar': 'application/x-tar',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  'ts': 'video/mp2t',
  'ttf': 'font/ttf',
  'txt': 'text/plain',
  'vsd': 'application/vnd.visio',
  'wav': 'audio/wav',
  'weba': 'audio/webm',
  'webm': 'video/webm',
  'webp': 'image/webp',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'xhtml': 'application/xhtml+xml',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xml': 'text/xml',
  'xul': 'application/vnd.mozilla.xul+xml',
  'zip': 'application/zip',
  '3gp': 'video/3gpp',
  '7z': 'application/x-7z-compressed',
  '7-zip': 'application/x-7z-compressed'
};

/**
 * Returns an array of properties in the property list.
 *
 * @param {Object} propertyList - Postman SDK property list
 * @param {Boolean} includeDisabled - Determines whether disabled properties are to be returned
 * @returns {Object} List of members
 */
function getMembersOfPropertyList<T extends object>(propertyList: PropertyList<T>, includeDisabled: boolean = false): T[] {
  if (!includeDisabled) {
    return propertyList.filter((prop) => !('disabled' in prop) || !prop.disabled, undefined);
  }

  return propertyList.all();
}

/**
 * Stringifies the members of the property list.
 *
 * @param {Object} propertyList propertyList
 * @param {String} joinUsing specify string that should be used to join the list of properties
 * @param {Boolean} includeDisabled indicated whether or not to include disabled properties
 * @param {Boolean} trimRequestBody indicates whether or not to trim request body
 * @returns {String} Stringified property List
 */
function convertPropertyListToString<T extends object>(propertyList: PropertyList<T>, joinUsing: string, includeDisabled: boolean = false, trimRequestBody: boolean = false): string {
  let properties = getMembersOfPropertyList(propertyList, includeDisabled);
  return properties.map((prop) => trimRequestBody ? prop.toString().trim() : prop.toString()).join(joinUsing);
}

/**
 * Url encodes the members of the property list.
 *
 * @param {Object} propertyList propertyList
 * @param {String} joinUsing specify string that should be used to join the list of properties
 * @param {Boolean} includeDisabled indicated whether or not to include disabled properties
 * @param {Boolean} trimRequestBody indicates whether or not to trim request body
 * @returns {String} Stringified and Url encoded property List
 */
function convertPropListToStringUrlEncoded(propertyList: PropertyList<QueryParam>, joinUsing: string, includeDisabled: boolean = false, trimRequestBody: boolean = false): string {
  const properties = getMembersOfPropertyList(propertyList, includeDisabled),
    keyvalues = new Array<string>();

  properties.forEach((property) => {
    const key = trimRequestBody ? property.key?.trim() : property.key,
      value = trimRequestBody ? property.value?.trim() : property.value,
      keyvalue = `${encodeURIComponent(key ?? '')}=${encodeURIComponent(value ?? '')}`;

    keyvalues.push(keyvalue);
  });

  return keyvalues.join(joinUsing);
}


/**
 * Returns the request headers as a string
 *
 * @param {Object} request - Postman SDK request
 * @returns {Function} calls convertPropertyListToString
 */
export function getHeaders(request: Request): string {
  let contentTypeIndex = findIndex(request.headers.all(), { key: 'Content-Type' }),
    formDataHeader = `multipart/form-data; boundary=${FORM_DATA_BOUNDARY}`,
    headers = '';

  if (contentTypeIndex >= 0) {
    if (request.headers.all()[contentTypeIndex].value === 'multipart/form-data' ||
      (request.body && request.body.mode === 'formdata')) {
      request.headers.all()[contentTypeIndex].value = formDataHeader;
    }
  }

  forEach(request.headers.all(), (header) => header.key = header.key.trim());
  headers = convertPropertyListToString(request.headers, '\n', false);
  if (request.body && request.body.mode === 'formdata' && contentTypeIndex < 0) {
    headers += `\nContent-Type: ${formDataHeader}`;
  }
  return headers;
}

/**
 * Returns the request body as a string
 *
 * @param {Object} request - Postman SDK request
 * @param {Boolean} trimRequestBody - Determines whether to trim the body
 * @returns {String} returns Body of the request
 */
export function getBody(request: Request, trimRequestBody: boolean): string {
  let requestBody = '';
  if (request.body) {
    switch (request.body.mode) {
      case RAW:
        if (!isEmpty(request.body[request.body.mode])) {
          requestBody += request.body.raw;
        }
        return trimRequestBody ? requestBody.trim() : requestBody;
      case URL_ENCODED:
        if (!isEmpty(request.body[request.body.mode])) {
          const propertyList = request.body[request.body.mode];
          requestBody += convertPropListToStringUrlEncoded(propertyList!, '&', false, trimRequestBody);
        }
        return trimRequestBody ? requestBody.trim() : requestBody;

      case FORM_DATA:
        requestBody += `--${FORM_DATA_BOUNDARY}\n`;
        if (!isEmpty(request.body[request.body.mode])) {
          let properties = getMembersOfPropertyList(request.body[request.body.mode]!),
            numberOfProperties = properties.length;
          forEach(properties, function (property, index) {
            if (property.type === 'text') {
              requestBody += 'Content-Disposition: form-data; name="';
              requestBody += `${(trimRequestBody ? property.key.trim() : property.key)}"\n`;
              if (property.contentType) {
                requestBody += `Content-Type: ${property.contentType}\n`;
              }
              requestBody += `\n${(trimRequestBody ? property.value.trim() : property.value)}\n`;
            }
            else if (property.type === 'file') {
              var pathArray = property.src.split(sep),
                fileName = pathArray[pathArray.length - 1],
                fileExtension = fileName.split('.')[1] as keyof typeof contentTypeHeaderMap;
              requestBody += 'Content-Disposition: form-data; name="';
              requestBody += `${(trimRequestBody ? property.key.trim() : property.key)}"; filename="`;
              requestBody += `${fileName}"\n`;
              if (contentTypeHeaderMap[fileExtension]) {
                requestBody += `Content-Type: ${contentTypeHeaderMap[fileExtension]}\n\n`;
              }
              else {
                requestBody += 'Content-Type: <Content-Type header here>\n\n';
              }
              requestBody += '(data)\n';
            }
            if (index === numberOfProperties - 1) {
              requestBody += `--${FORM_DATA_BOUNDARY}--\n`;
            }
            else {
              requestBody += `--${FORM_DATA_BOUNDARY}\n`;
            }
          });
        }
        return trimRequestBody ? requestBody.trim() : requestBody;

      case FILE:
        return '"<file contents here>"';
      default:
        return requestBody;
    }
  }
  return '';
}
