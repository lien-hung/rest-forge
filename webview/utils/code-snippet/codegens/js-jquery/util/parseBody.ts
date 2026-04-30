import { Request } from 'postman-collection';
import { isEmpty } from '../../../common/lodash';
import { sanitize } from './sanitize';

/**
 * Used to parse the body of the postman SDK-request and return in the desired format
 *
 * @param  {Object} request - postman SDK-request object
 * @param  {Boolean} trimRequestBody - whether to trim request body fields
 * @param  {String} indentation - used for indenting snippet's structure
 * @param {String} contentType Content type of the body being sent
 * @returns {String} - request body
 */
export default function (request: Request, trimRequestBody: boolean, indentation: string, contentType: string): string {
  if (request.body) {
    var requestBody = '',
      bodyMap,
      enabledBodyList;

    switch (request.body.mode) {
      case 'raw':
        if (request.body.raw) {
          if (contentType && (contentType === 'application/json' || contentType.match(/\+json$/))) {
            try {
              let jsonBody = JSON.parse(request.body.raw);
              requestBody += `${indentation}"data": JSON.stringify(${JSON.stringify(jsonBody,
                null, indentation.length).replace(/\n/g, `\n${indentation}`)}),\n`;
            }
            catch (error) {
              requestBody += `${indentation}"data": ` +
                `${sanitize(request.body.raw, 'raw', trimRequestBody)},\n`;
            }
          }
          else {
            requestBody += `${indentation}"data": ` +
              `${sanitize(request.body.raw, 'raw', trimRequestBody)},\n`;
          }
        }
        return requestBody;
      case 'urlencoded':
        enabledBodyList = request.body.urlencoded?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList && !isEmpty(enabledBodyList)) {
          bodyMap = enabledBodyList.map((param) => `${indentation.repeat(2)}"${sanitize(param.key, 'urlencoded', trimRequestBody)}": "${sanitize(param.value, 'urlencoded', trimRequestBody)}"`);
          requestBody = `${indentation}"data": {\n${bodyMap.join(',\n')}\n${indentation}}\n`;
        }
        return requestBody;
      case 'formdata':
        requestBody = `${indentation}"processData": false,\n` +
          `${indentation}"mimeType": "multipart/form-data",\n` +
          `${indentation}"contentType": false,\n` +
          `${indentation}"data": form\n`;
        return requestBody;
      case 'file':
        requestBody = `${indentation} "data": "<file contents here>"\n`;
        return requestBody;
      default:
        return requestBody;
    }
  }
  return '';
};
