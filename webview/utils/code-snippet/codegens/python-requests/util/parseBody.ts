import { Request } from 'postman-collection';
import { isEmpty } from '../../../common/lodash';
import { sanitize } from './sanitize';
var trueToken = '__PYTHON#%0True__';
var falseToken = '__PYTHON#%0False__';
var nullToken = '__PYTHON#%0NULL__';
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
 * Convert true, false and null to Python equivalent True, False and None
 *
 * @param {String} _
 * @param {Object} value
 */
function replacer(_: string, value: object) {
  if (typeof value === 'boolean') {
    return value ? trueToken : falseToken;
  } else if (value === null) {
    return nullToken;
  }
  return value;
}

/**
 * Convert JSON into a valid Python dict
 * The "true", "false" and "null" tokens are not valid in Python
 * so we need to convert them to "True", "False" and "None"
 *
 * @param  {Object} jsonBody - JSON object to be converted
 * @param  {Number} indentCount - Number of spaces to insert at each indentation level
 */
function pythonify(jsonBody: object, indentCount: number) {
  return JSON.stringify(jsonBody, replacer, indentCount)
    .replace(new RegExp(`"${trueToken}"`, 'g'), 'True')
    .replace(new RegExp(`"${falseToken}"`, 'g'), 'False')
    .replace(new RegExp(`"${nullToken}"`, 'g'), 'None');
}

/**
 * Used to parse the body of the postman SDK-request and return in the desired format
 *
 * @param  {Object} request - postman SDK-request object
 * @param  {String} indentation - used for indenting snippet's structure
 * @param  {Boolean} bodyTrim - whether to trim request body fields
 * @param  {String} contentType - content-type of body
 * @returns {String} - request body
 */
export default function (request: Request, indentation: string, bodyTrim: boolean, contentType: string) {
  if (request.body) {
    var requestBody = '',
      bodyDataMap,
      bodyFileMap,
      enabledBodyList;

    switch (request.body.mode) {
      case 'raw':
        if (isEmpty(request.body.raw)) {
          requestBody = 'payload = {}\n';
        }

        if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
          try {
            let jsonBody = JSON.parse(String(request.body.raw));
            return `payload = json.dumps(${pythonify(jsonBody, indentation.length)})\n`;
          } catch (error) {
            // Do nothing
          }
        }
        return `payload = ${sanitize(request.body.raw, 'raw', bodyTrim)}\n`;
      case 'urlencoded':
        enabledBodyList = request.body.urlencoded?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          bodyDataMap = enabledBodyList.map(function (param) {
            return `${sanitize(param.key, 'urlencoded', bodyTrim)}=${sanitize(param.value, 'urlencoded', bodyTrim)}`;
          });
          requestBody += `payload = '${bodyDataMap.join('&')}'\n`;
        }
        else {
          requestBody = 'payload = {}\n';
        }
        return requestBody;
      case 'formdata':
        enabledBodyList = request.body.formdata?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          bodyDataMap = enabledBodyList
            .filter((param) => 'type' in param && param.type === 'text')
            .map((param) => `'${sanitize(param.key, 'formdata', bodyTrim)}': '${sanitize(param.value, 'formdata', bodyTrim)}'`);
          bodyFileMap = enabledBodyList
            .filter((param) => 'type' in param && param.type === 'file')
            .map((param) => {
              var filesrc = 'src' in param ? String(param.src) : '',
                fileType = filesrc.split('.')[filesrc.split('.').length - 1] as keyof typeof contentTypeHeaderMap,
                contentType = contentTypeHeaderMap[fileType];

              if (!contentType) {
                contentType = 'application/octet-stream';
              }
              return `${indentation}('${param.key}',('${filesrc.split('/')[filesrc.split('/').length - 1]}'` +
                `,open('${sanitize(filesrc, 'formdata', bodyTrim)}','rb'),'${contentType}'))`;
            });
          requestBody = `payload = {${bodyDataMap.join(',\n')}}\nfiles=[\n${bodyFileMap.join(',\n')}\n]\n`;
        } else {
          requestBody = 'payload = {}\nfiles={}\n';
        }
        return requestBody;
      case 'file':
        return 'payload = "<file contents here>"\n';
      default:
        return 'payload = {}\n';
    }
  }
  return 'payload = {}\n';
}
;
