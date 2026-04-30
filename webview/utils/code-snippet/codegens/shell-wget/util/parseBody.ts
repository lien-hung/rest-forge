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
      bodyMap = new Array<string>(),
      enabledBodyList;

    switch (request.body.mode) {
      case 'raw':
        if (!isEmpty(request.body.raw)) {
          requestBody += `${indentation}--body-data ` +
            `'${sanitize(request.body.raw, 'raw', trimRequestBody)}' \\\n`;
        }
        return requestBody;
      case 'urlencoded':
        enabledBodyList = request.body.urlencoded?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          bodyMap = enabledBodyList.map(function (value) {
            return `${sanitize(value.key, 'urlencoded', trimRequestBody)}=` +
              `${sanitize(value.value, 'urlencoded', trimRequestBody)}`;
          });
          requestBody = `${indentation}--body-data '${bodyMap.join('&')}' \\\n`;
        }
        return requestBody;
      case 'formdata':
        enabledBodyList = request.body.formdata?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          enabledBodyList.forEach(function (value) {
            if ('type' in value && value.type === 'text') {
              bodyMap.push(`${sanitize(value.key, 'formdata', trimRequestBody)}=` +
                `${sanitize(value.value, 'formdata', trimRequestBody)}`);
            }
          });
          requestBody = `${indentation}--body-data '${bodyMap.join('&')}' \\\n`;
        }
        return requestBody;
      case 'file':
        requestBody = `${indentation}--body-file='`;
        requestBody += `${sanitize(request.body.file?.src, 'file', trimRequestBody)}' \\\n`;
        return requestBody;
      default:
        return requestBody;
    }
  }
  return '';
};
