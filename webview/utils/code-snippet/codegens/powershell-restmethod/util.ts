/**
 * sanitizes input string by handling escape characters eg: converts '''' to '\`'\`''
 * and trim input if required
 *
 * @param {String} inputString
 * @param {Boolean} [trim] - indicates whether to trim string or not
 * @param {Boolean} shouldEscapeNewLine - indicates whether to escape newline
 * @returns {String}
 */
export function sanitize(inputString: string, trim?: boolean, shouldEscapeNewLine: boolean = true): string {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString
    .replace(/`/g, '``')
    .replace(/\$/g, '`$')
    .replace(/\\/g, '\`\\')
    .replace(/\"/g, '\`\"');

  if (shouldEscapeNewLine) {
    inputString = inputString.replace(/\n/g, '\`n');
  }
  return trim ? inputString.trim() : inputString;
}

/**
 *
 * @param {String} inputString - input string
 * @returns {String} - sanitized string
 */
export function sanitizeSingleQuotes(inputString: string): string {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString
    .replace(/'/g, '\'\'');

  return inputString;
}
