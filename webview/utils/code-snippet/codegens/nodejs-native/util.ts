export function sanitize(inputString?: string | null, trim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }
  (trim) && (inputString = inputString.trim());
  return inputString.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n');
}