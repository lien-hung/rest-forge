/**
 * sanitizes input string by handling escape characters eg: converts '''' to '\'\''
 * and trim input if required
 *
 * @param {String} inputString
 * @param {Boolean} [trim] - indicates whether to trim string or not
 * @returns {String}
 */
export function sanitize(inputString: string | null, trim?: boolean): string {
  if (typeof inputString !== 'string') {
    return '';
  }

  (trim) && (inputString = inputString.trim());
  return inputString.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}