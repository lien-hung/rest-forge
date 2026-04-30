import { Request } from 'postman-collection';
import { isEmpty } from '../../../common/lodash';
import { sanitize } from './sanitize';
import { sep } from 'path';
var trueToken = '__PYTHON#%0True__';
var falseToken = '__PYTHON#%0False__';
var nullToken = '__PYTHON#%0NULL__';

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
 * @param  {String} contentType - content type of body
 * @returns {String} - request body
 */
export default function (request: Request, indentation: string, bodyTrim: boolean, contentType: string): string {
  if (request.body && !isEmpty(request.body)) {
    var requestBody = '',
      bodyDataMap,
      enabledBodyList;

    switch (request.body.mode) {
      case 'raw':
        if (isEmpty(request.body.raw)) {
          return 'payload = \'\'\n';
        }
        if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
          try {
            let jsonBody = JSON.parse(String(request.body.raw));
            return `payload = json.dumps(${pythonify(jsonBody, indentation.length)})\n`;
          }
          catch (error) {
            // Do nothing
          }
        }
        return `payload = ${sanitize(request.body.raw, request.body.mode, bodyTrim)}\n`;
      case 'urlencoded':
        enabledBodyList = request.body.urlencoded?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          bodyDataMap = enabledBodyList.map(function (value) {
            return `${sanitize(value.key, 'urlencoded', bodyTrim)}=` +
              `${sanitize(value.value, 'urlencoded', bodyTrim)}`;
          });
          requestBody += `payload = '${bodyDataMap.join('&')}'\n`;
        } else {
          requestBody = 'payload = \'\'\n';
        }
        return requestBody;
      case 'formdata':
        enabledBodyList = request.body.formdata?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          requestBody += 'dataList = []\n';
          requestBody += 'boundary = \'wL36Yn8afVp8Ag7AmP8qZ0SA4n1v9T\'\n';
          enabledBodyList.forEach((data) => {
            requestBody += 'dataList.append(encode(\'--\' + boundary))\n';
            if ('type' in data && data.type !== 'file') {
              requestBody += `dataList.append(encode('Content-Disposition: form-data; name=${sanitize(data.key, 'form-data', true)};'))\n\n`;
              requestBody += 'dataList.append(encode(\'Content-Type: {}\'.format(\'' +
                ('contentType' in data ? data.contentType : 'text/plain') + '\')))\n';
              requestBody += 'dataList.append(encode(\'\'))\n\n';
              requestBody += `dataList.append(encode("${sanitize(data.value, 'form-data', true)}"))\n`;
            } else {
              let src = 'src' in data ? String(data.src) : '';
              var pathArray = src.split(sep),
                fileName = pathArray[pathArray.length - 1];
              requestBody += `dataList.append(encode('Content-Disposition: form-data; name=${sanitize(data.key, 'form-data', true)}; filename={0}'.format('${sanitize(fileName, 'formdata', true)}')))\n\n`;
              requestBody += `fileType = mimetypes.guess_type('${sanitize(src, 'formdata', true)}')[0] or 'application/octet-stream'\n`;
              requestBody += 'dataList.append(encode(\'Content-Type: {}\'.format(fileType)))\n';
              requestBody += 'dataList.append(encode(\'\'))\n\n';

              requestBody += `with open('${src}', 'rb') as f:\n`;
              requestBody += `${indentation}dataList.append(f.read())\n`;
            }
          });
          requestBody += 'dataList.append(encode(\'--\'+boundary+\'--\'))\n';
          requestBody += 'dataList.append(encode(\'\'))\n';
          requestBody += 'body = b\'\\r\\n\'.join(dataList)\n';
          requestBody += 'payload = body\n';
        }
        else {
          requestBody = 'boundary = \'\'\n';
          requestBody += 'payload = \'\'\n';
        }
        return requestBody;
      case 'file':
        return 'payload = "<file contents here>"\n';
      default:
        return 'payload = \'\'\n';
    }
  }
  return 'payload = \'\'\n';
};
