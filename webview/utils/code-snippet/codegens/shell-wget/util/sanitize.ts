export function sanitize(inputString?: string | null, escapeCharFor?: string, inputTrim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputTrim && typeof inputTrim === 'boolean' ? inputString.trim() : inputString;
  if (escapeCharFor && typeof escapeCharFor === 'string') {
    switch (escapeCharFor) {
      case 'raw':
        return inputString.replace(/'/g, '\'\\\'\'');
      case 'urlencoded':
        return encodeURIComponent(inputString).replace(/'/g, '\'\\\'\'');
      case 'formdata':
        return inputString.replace(/'/g, '\\\'');
      /* istanbul ignore next */
      case 'file':
        return inputString.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
      case 'header':
        return inputString.replace(/'/g, '\'\\\'\'');
      case 'url':
        return inputString.replace(/'/g, '\'\\\'\'');
      default:
        return inputString.replace(/'/g, '\'');
    }
  }
  return inputString;
}