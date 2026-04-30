import { Request } from 'postman-collection';
import { isEmpty } from '../../../common/lodash';
import { sanitize } from './sanitize';

/**
 * Used to parse the body of the postman SDK-request and return in the desired format
 *
 * @param  {Object} request - postman SDK-request object
 * @param  {String} indentation - used for indenting snippet's structure
 * @param  {Boolean} bodyTrim - whether to trim body fields or not
 * @returns {String} - request body
 */
export default function (request: Request, indentation: string, bodyTrim: boolean): string {
  // used to check whether body is present in the request or not
  if (request.body) {
    var bodyDataMap = [],
      bodyFileMap = [],
      requestBody = '',
      enabledBodyList;

    switch (request.body.mode) {
      case 'raw':
        if (!isEmpty(request.body[request.body.mode])) {
          requestBody += `$body->append('${request.body[request.body.mode]}');\n`;
        }
        return requestBody;
      case 'urlencoded':
        enabledBodyList = request.body.urlencoded?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          bodyDataMap = enabledBodyList.map(function (value) {
            return `${indentation}'${sanitize(value.key, bodyTrim)}' => ` +
              `'${sanitize(value.value, bodyTrim)}'`;
          });
          requestBody = `$body->append(new http\\QueryString(array(\n${bodyDataMap.join(',\n')})));`;
        }
        return requestBody;
      case 'formdata':
        enabledBodyList = request.body.formdata?.filter((param) => !param.disabled, undefined);
        if (enabledBodyList) {
          bodyDataMap = enabledBodyList
            .filter((param) => 'type' in param && param.type === 'text')
            .map((param) => `${indentation}'${sanitize(param.key, bodyTrim)}' => '${sanitize(param.value, bodyTrim)}'`);
          bodyFileMap = enabledBodyList
            .filter((param) => 'type' in param && param.type === 'file')
            .map((param) => `${indentation.repeat(2)}array('name' => '${sanitize(param.key, bodyTrim)}', ` +
              '\'type\' => \'<Content-type header>\', ' +
              `'file' => '${sanitize('src' in param ? String(param.src) : '', bodyTrim)}', ` +
              '\'data\' => null)');
          requestBody = `$body->addForm(array(\n${bodyDataMap.join(',\n')}\n), ` +
            `array(\n${bodyFileMap.join(',\n')}\n));\n`;
        }
        return requestBody;
      case 'file':
        requestBody = '$body->append(\'<file contents here>\');\n';
        return requestBody;
      default:
        return requestBody;
    }
  }
  return '';
};
