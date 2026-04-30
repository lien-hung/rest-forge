export function sanitize(inputString: string, trim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }

  (trim) && (inputString = inputString.trim());
  return inputString
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}