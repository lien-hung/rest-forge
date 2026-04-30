export function sanitize(inputString?: string | null, trim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString.replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/'/g, '\\\'')
    .replace(/\$/g, '\\$');
  return trim ? inputString.trim() : inputString;
}