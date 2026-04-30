import { Request } from 'postman-collection';
import { isEmpty } from '../../../common/lodash';
import { sanitize } from './sanitize';
var nullToken = '__RUBY#%0NULL__';

/**
 * Convert null to Ruby equivalent nil
 *
 * @param {String} _
 * @param {Object} value
 */
function replacer(_: string, value: object) {
  if (value === null) {
    return nullToken;
  }
  return value;
}

/**
 * Used to parse the body of the postman SDK-request and return in the desired format
 *
 * @param  {Object} request - postman SDK-request object
 * @param  {Boolean} trimRequestBody - whether to trim request body fields
 * @param  {string} contentType - the content type of request body
 * @param  {Integer} indentCount - the count of indentation characters to use
 * @returns {String} - request body
 */
export default function (request: Request, trimRequestBody: boolean, contentType: string, indentCount: number): string {
  if (request.body) {
    var requestBody = '',
      bodyMap = new Array<string>(),
      enabledBodyList;

    switch (request.body.mode) {
      case 'raw':
        if (isEmpty(request.body.raw)) {
          return '';
        }

        if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
          try {
            let jsonBody = JSON.parse(String(request.body.raw));
            jsonBody = sanitize(JSON.stringify(jsonBody, replacer, indentCount));
            jsonBody = jsonBody.replace(new RegExp(`"${nullToken}"`, 'g'), 'nil');
            return `request.body = JSON.dump(${jsonBody})\n`;
          }
          catch (error) {
            // Do nothing
          }
        }

        requestBody += 'request.body = ' + `${sanitize(request.body.raw, request.body.mode, trimRequestBody)}\n`;
        return requestBody;
      case 'urlencoded':
        enabledBodyList = request.body.urlencoded?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          bodyMap = enabledBodyList.map(function (value) {
            return `${sanitize(value.key, 'urlencoded', trimRequestBody)}=` +
              `${sanitize(value.value, 'urlencoded', trimRequestBody)}`;
          });
          requestBody = `request.body = "${sanitize(bodyMap.join('&'), 'doubleQuotes')}"\n`;
        }
        return requestBody;
      case 'formdata':
        enabledBodyList = request.body.formdata?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          bodyMap = enabledBodyList.map(function (data) {
            if ('type' in data && data.type === 'text') {
              return `['${sanitize(data.key, 'formdata', trimRequestBody)}',` +
                ` '${sanitize(data.value, 'formdata', trimRequestBody)}']`;
            }
            return `['${sanitize(data.key, 'formdata', trimRequestBody)}', File.open('${'src' in data ? String(data.src) : ''}')]`;
          });
        }
        requestBody = `form_data = [${bodyMap.join(',')}]\n`;
        requestBody += 'request.set_form form_data, \'multipart/form-data\'';
        return requestBody;
      case 'file':
        requestBody = 'request.body = "<file contents here>"\n';
        return requestBody;
      default:
        return requestBody;

    }
  }
  return '';
};
