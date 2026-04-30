/**
 * sanitizes input string by handling escape characters eg: converts '''' to '\'\'' and trim input if required
 *
 * @param {String} inputString - Input string to sanitize
 * @param {Boolean} [trim] - Indicates whether to trim string or not
 * @returns {String} Sanitized String handling escape characters
 */
export function sanitize(inputString?: string | null, trim?: boolean): string {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return trim ? inputString.trim() : inputString;
}

/**
 *
 * @param {String} inputString - The string to return in a C# style
 * @returns {String} The string in a C# style
 */
export function csharpify(inputString: string): string {
  if (typeof inputString !== 'string') {
    return '';
  }

  inputString = inputString.toLowerCase();

  return inputString.charAt(0).toUpperCase() + inputString.slice(1);
}