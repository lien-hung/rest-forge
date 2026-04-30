import { Request } from 'postman-collection';
import { isEmpty } from '../../../common/lodash';
import { sanitize } from './sanitize';

/**
 * Used to parse the body of the postman SDK-request and return in the desired format
 *
 * @param  {Object} request - postman SDK-request object
 * @param  {Boolean} trimRequestBody - whether to trim request body fields
 * @param  {String} indentation - used for indenting snippet's structure
 * @returns {String} - request body
 */
export default function (request: Request, trimRequestBody: boolean, indentation: string): string {
  if (request.body) {
    var requestBody = '',
      bodyMap,
      enabledBodyList;

    switch (request.body.mode) {
      case 'raw':
        if (!isEmpty(request.body[request.body.mode])) {
          requestBody += `${indentation}CURLOPT_POSTFIELDS =>` +
            `'${sanitize(request.body.raw, 'raw', trimRequestBody)}',\n`;
        }
        return requestBody;
      case 'urlencoded':
        enabledBodyList = request.body.urlencoded?.filter((item) => !item.disabled, undefined);
        if (enabledBodyList) {
          bodyMap = enabledBodyList.map(function (value) {
            return `${sanitize(value.key, 'urlencoded', trimRequestBody)}=` +
              `${sanitize(value.value, 'urlencoded', trimRequestBody)}`;
          });
          requestBody = `${indentation}CURLOPT_POSTFIELDS => '${bodyMap.join('&')}',\n`;
        }
        return requestBody;
      case 'formdata':
        enabledBodyList = request.body.formdata?.filter((item) => !item.disabled, undefined);
        if (enabledBodyList) {
          bodyMap = enabledBodyList.map(function (value) {
            if ('type' in value && value.type === 'text') {
              return (`'${sanitize(value.key, 'formData', trimRequestBody)}' => '` +
                `${sanitize(value.value, 'formData', trimRequestBody)}'`);
            }
            else if ('type' in value && value.type === 'file' && 'src' in value) {
              return `'${sanitize(value.key, 'formData', trimRequestBody)}'=> ` +
                `new CURLFILE('${sanitize(String(value.src), 'formData', trimRequestBody)}')`;
            }
          });
          requestBody = `${indentation}CURLOPT_POSTFIELDS => array(${bodyMap.join(',')}),\n`;
        }
        return requestBody;
      case 'file':
        requestBody = `${indentation}CURLOPT_POSTFIELDS => "<file contents here>",\n`;
        return requestBody;
      default:
        return requestBody;

    }
  }
  return '';
};
