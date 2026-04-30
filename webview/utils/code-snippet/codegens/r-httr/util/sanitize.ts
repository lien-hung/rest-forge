export function sanitizeString(inputString: string | null | undefined, inputTrim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputTrim && typeof inputTrim === 'boolean' ? inputString.trim() : inputString;
  return inputString
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'');
}