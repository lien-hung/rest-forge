export function sanitize(inputString: string | null | undefined, escapeCharFor?: string, inputTrim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputTrim && typeof inputTrim === 'boolean' ? inputString.trim() : inputString;
  inputString = inputString
    .replace(/`/g, '\\`')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/!/g, '\\!');
  if (escapeCharFor && typeof escapeCharFor === 'string') {
    switch (escapeCharFor) {
      case 'raw':
        return JSON.stringify(inputString);
      case 'urlencoded':
        return encodeURIComponent(inputString);
      case 'formdata':
        return inputString.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
      case 'file':
        return inputString.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
      case 'header':
        return inputString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      default:
        return inputString.replace(/"/g, '\\"');
    }
  }
  return inputString;
}