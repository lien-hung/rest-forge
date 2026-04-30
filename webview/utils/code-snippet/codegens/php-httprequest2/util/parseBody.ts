import { Request } from 'postman-collection';
import { isEmpty, forEach } from '../../../common/lodash';
import { sanitize } from './sanitize';
import { sep } from 'path';

export default function (request: Request, indentString: string, trim: boolean) {
  var bodySnippet = '',
    bodyFileMap = [],
    bodyDataMap = [],
    enabledBodyList;

  switch (request.body?.mode) {
    case 'raw':
      bodySnippet += `$request->setBody('${sanitize(request.body.raw, trim)}');\n`;
      break;
    case 'urlencoded':
      enabledBodyList = request.body.urlencoded?.filter((data) => !data.disabled, undefined);
      if (enabledBodyList && !isEmpty(enabledBodyList)) {
        bodyDataMap = enabledBodyList.map((data) => {
          return `${indentString}'${sanitize(data.key, trim)}' => '${sanitize(data.value, trim)}'`;
        });
        bodySnippet += `$request->addPostParameter(array(\n${bodyDataMap.join(',\n')}\n));\n`;
      }
      break;
    case 'formdata':
      enabledBodyList = request.body.formdata?.filter((data) => !data.disabled, undefined);
      if (enabledBodyList && !isEmpty(enabledBodyList)) {
        bodyDataMap = enabledBodyList
          .filter((data) => 'type' in data && data.type === 'text')
          .map((data) => `${indentString}'${sanitize(data.key, trim)}' => '${sanitize(data.value, trim)}'`);
        bodyFileMap = enabledBodyList
          .filter((data) => 'type' in data && data.type === 'file')
          .map((data) => {
            let src = 'src' in data ? String(data.src) : '',
              pathArray = src.split(sep),
              fileName = pathArray[pathArray.length - 1];
            return `'${sanitize(data.key, trim)}', '${src}', '${fileName}', '<Content-Type Header>'`;
          });

        if (bodyDataMap.length) {
          bodySnippet += `$request->addPostParameter(array(\n${bodyDataMap.join(',\n')}\n));\n`;
        }
        if (bodyFileMap.length) {
          forEach(bodyFileMap, (file) => bodySnippet += `$request->addUpload(${file});\n`);
        }
      }
      break;
    case 'file':
      bodySnippet += '$request->setBody(\'<file contents here>\');\n';
      break;
    default:
      break;
  }
  return bodySnippet;
};
