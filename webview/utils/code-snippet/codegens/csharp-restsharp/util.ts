import { FormParam } from "./type";

/**
 * sanitizes input string by handling escape characters eg: converts '''' to '\'\'' and trim input if required
 *
 * @param {String} inputString - Input String to sanitize
 * @param {Boolean} [trim] - Indicates whether to trim string or not
 * @returns {String} Sanitized String handling escape characters
 */
export function sanitize(inputString?: string, trim?: boolean): string {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return trim ? inputString.trim() : inputString;
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
export function addFormParam(array: Array<FormParam>, key: string, type: string, val: string, disabled: boolean, contentType: string) {
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