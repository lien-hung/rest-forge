function resolveVariable(str: string, variables: { [key: string]: string }) {
  const matches = [...str.matchAll(/\{\{([^}]+)\}\}/gi)];
  const stripBracket = (s: string) => s.replace("{{", "").replace("}}", "");

  for (const match of matches) {
    const varName = stripBracket(match[0]);
    if (variables[varName]) {
      str = str.replace(match[0], variables[varName]);
    } else {
      str = str.replace(match[0], "");
    }
  }
  return str;
}

export default resolveVariable;