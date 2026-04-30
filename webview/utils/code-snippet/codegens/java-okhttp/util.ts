export function sanitize(inputString?: string | null, trim?: boolean) {
  if (typeof inputString !== 'string') {
    return '';
  }
  inputString = inputString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return trim ? inputString.trim() : inputString;
}