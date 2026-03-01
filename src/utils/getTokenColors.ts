import { readFileSync } from "fs";
import path from "path";
import { extensions } from "vscode";

interface TokenColorObjectValue {
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

interface TokenColor {
  token: string;
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

function getTokenColors(themeName: string): TokenColor[] {
  const tokenColorObject: { [token: string]: TokenColorObjectValue } = {};
  
  // Get theme path (returns empty for default themes)
  let currentThemePath;
  for (const extension of extensions.all) {
    const themes = extension.packageJSON.contributes && extension.packageJSON.contributes.themes;
    const currentTheme = themes && themes.find((theme: any) => theme.label === themeName);
    if (currentTheme) {
      currentThemePath = path.join(extension.extensionPath, currentTheme.path);
      break;
    }
  }

  // Get token color object
  const themePaths = [];
  if (currentThemePath) { themePaths.push(currentThemePath); }
  while (themePaths.length > 0) {
    // Get theme data
    const themePath = themePaths.pop();
    if (!themePath) {
      throw new Error("Theme path empty");
    }
    const themeData = readFileSync(themePath, { encoding: "utf8" });
    const theme: any = JSON.parse(themeData);

    if (theme) {
      if (theme.include) {
        themePaths.push(path.join(path.dirname(themePath), theme.include));
      }
      if (theme.tokenColors) {
        theme.tokenColors.forEach((rule: any) => {
          if (typeof rule.scope === "string") {
            // Scope sometimes are separated by commas
            const scopes = rule.scope.split(",");
            scopes.forEach((scope: string) => {
              tokenColorObject[scope.trim()] = rule.settings;
            });
          } else if (rule.scope instanceof Array) {
            rule.scope.forEach((scope: string) => {
              tokenColorObject[scope] = rule.settings;
            });
          }
        });
      }
    }
  }

  // Get relevant token colors in array
  const findKey = (subKey: string) => {
    const objectKeys = Object.keys(tokenColorObject);
    return objectKeys.find(scope => scope.includes(subKey)) || "";
  };

  const constantLanguageBoolean = findKey("constant.language.boolean");
  const constantLanguage = findKey("constant.language");
  const stringQuotedDouble = findKey("string.quoted.double");
  const propertyNameJson = findKey("support.type.property-name.json");

  return [
    // General
    { token: "string",          ...tokenColorObject["string"] },
    { token: "keyword",         ...tokenColorObject["keyword"] },
    { token: "number",          ...tokenColorObject["constant.numeric"] },
    { token: "comment",         ...tokenColorObject["comment"] },
    { token: "delimiter",       ...tokenColorObject["punctuation"] },
    { token: "attribute.name",  ...tokenColorObject["entity.other.attribute-name"] },
    { token: "attribute.value", ...tokenColorObject["string"] },
    { token: "tag",             ...tokenColorObject["entity.name.tag"] },
    { token: "type.identifier", ...tokenColorObject["support.class"] },
    
    // JSON specific
    { token: "string.key.json",   ...tokenColorObject[propertyNameJson], },
    { token: "string.value.json", ...tokenColorObject[stringQuotedDouble || "string"], },
    { token: "keyword.json",      ...tokenColorObject[constantLanguageBoolean || constantLanguage] },

    // HTML/XML
    { token: "metatag.xml",    ...tokenColorObject["entity.name.tag"] },
    { token: "delimiter.html", ...tokenColorObject["punctuation.definition.tag"] },
    { token: "delimiter.xml",  ...tokenColorObject["punctuation.definition.tag"] },

    // Shell script
    { token: "attribute.name.shell", ...tokenColorObject["string.unquoted"] },
  ];
}

export default getTokenColors;