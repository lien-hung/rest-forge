import { RequestBody } from "postman-collection";
import { BaseSnippetOptions, DefaultOptions, FormField, PostgenOption } from "./type";

/**
  * parses a body to the corresponding snippet
  *
  * @param {object} body - postman request body
  */
export function solveMultiFile(body: RequestBody) {
  if (body && body.mode === 'formdata') {
    let formdata = body.formdata,
      formdataArray = new Array<FormField>();
    formdata?.all().forEach((param) => {
      let key = param.key,
        type = 'type' in param ? String(param.type) : '',
        disabled = param.disabled,
        contentType = 'contentType' in param ? String(param.contentType) : '',
        src = 'src' in param ? param.src : '';
      if (type === 'file') {
        if (typeof src !== 'string') {
          if (Array.isArray(src) && src.length) {
            src.forEach((filePath) => {
              addFormParam(formdataArray, key, type, filePath, disabled, contentType);
            });
          }
          else {
            addFormParam(formdataArray, key, type, '/path/to/file', disabled, contentType);
          }
        }
        else {
          addFormParam(formdataArray, key, type, src, disabled, contentType);
        }
      }
      else {
        addFormParam(formdataArray, key, type, param.value, disabled, contentType);
      }
    });
    body.update({
      mode: 'formdata',
      formdata: formdataArray
    });
  }
  return body;
}

/**
 * Sanitizes snippet options
 *
 * @param {Object} options Options provided by user
 * @param {Array} optionsArray Options array received from `getOptions` function
 *
 * @returns {Object} Sanitized options object
 */
export function sanitizeOptions<T extends BaseSnippetOptions>(options: T, optionsArray: Array<PostgenOption>): T {
  var result = <T>{},
    defaultOptions = <DefaultOptions>{};
  optionsArray.forEach((option) => {
    defaultOptions[option.id] = {
      default: option.default,
      type: option.type
    };
    if (option.type === 'enum') {
      defaultOptions[option.id].availableOptions = option.availableOptions;
    }
  });

  let id: keyof T;
  for (id in options) {
    if (options[id]) {
      const defaultOption = defaultOptions[id as string];
      if (defaultOption === undefined) {
        continue;
      }

      const defaultValue = defaultOption.default as T[keyof T];
      switch (defaultOption.type) {
        case 'boolean':
          if (typeof options[id] !== 'boolean') {
            result[id] = defaultValue;
          } else {
            result[id] = options[id];
          }
          break;
        case 'positiveInteger':
          if (typeof options[id] !== 'number' || Number(options[id]) < 0) {
            result[id] = defaultValue;
          } else {
            result[id] = options[id];
          }
          break;
        case 'enum':
          if (!defaultOption.availableOptions?.includes(String(options[id]))) {
            result[id] = defaultValue;
          } else {
            result[id] = options[id];
          }
          break;
        default:
          result[id] = options[id];
      }
    }
  }

  let key: string;
  for (key in defaultOptions) {
    const id = key as keyof T;
    if (defaultOptions[key] && result[id] === undefined) {
      result[id] = defaultOptions[key].default as T[keyof T];
    }
  }
  return result;
}

/**
 * Appends a single param to form data array
 * 
 * @param {Array} array - form data array
 * @param {String} key - key of form data param
 * @param {String} type - type of form data param(file/text)
 * @param {String} val - value/src property of form data param
 * @param {String} disabled - Boolean denoting whether the param is disabled or not
 * @param {String} contentType - content type header of the param
 */
export function addFormParam(array: Array<FormField>, key: string, type: string, val: string, disabled: boolean, contentType: string) {
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