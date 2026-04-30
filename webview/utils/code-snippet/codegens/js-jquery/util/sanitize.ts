export function sanitize(inputString: string | null, escapeCharFor: string, inputTrim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputTrim && typeof inputTrim === 'boolean' ? inputString.trim() : inputString;
  if (escapeCharFor && typeof escapeCharFor === 'string') {
    switch (escapeCharFor) {
      case 'raw':
        return JSON.stringify(inputString);
      case 'urlencoded':
        return inputString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      case 'formdata':
        return inputString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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