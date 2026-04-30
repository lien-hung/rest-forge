export function quote(value: string | null, mode?: string) {
  if (typeof value !== 'string' || value === '') {
    return '';
  }
  switch (mode) {
    case 'raw':
      return '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\'\\\'\'').replace(/%/, '%%') + '\'';
    default:
      return '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\'\\\'\'') + '\'';
  }
}