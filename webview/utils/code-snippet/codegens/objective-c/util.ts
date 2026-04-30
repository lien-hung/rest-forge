export function sanitize(inputString?: string | null, trim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString.replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return trim ? inputString.trim() : inputString;
}