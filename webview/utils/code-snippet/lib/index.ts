import { Request } from 'postman-collection';
import labelList from './assets/languageLabels.json';
import languageMap from './assets/languages';

interface LanguageInfo {
  key: string;
  label: string;
  syntax_mode: string;
  variants: { key: string }[];
}

export function getOptions(language: string, variant: string, callback: Function) {
  const validCodegen = languageMap.filter((codegen) => {
    const lang = codegen.lang.trim(), currentVariant = codegen.variant.trim();
    return language === lang.toLowerCase() && variant.toLowerCase() === currentVariant.toLowerCase();
  });

  validCodegen.forEach((codegen) => {
    const main = codegen.main;
    if (typeof main.getOptions !== 'function') {
      return callback('Codegen~getOptions: getOptions is not a function');
    }
    if (!main.getOptions) {
      return callback('Codegen~convert: Could not find codegen corresponding to provided language, variant pair');
    }

    return callback(null, main.getOptions());
  });
}

export function getLanguageList() {
  let langMap: Record<string, LanguageInfo> = {}, supportedLanguages = [];
  languageMap.forEach((codegen) => {
    let lang = codegen.lang.trim(), syntax_mode = codegen.syntax_mode.trim(), variant = codegen.variant.trim();
    lang = lang.toLowerCase();
    if (!langMap[lang]) {
      langMap[lang] = {
        key: lang,
        label: lang in labelList ? labelList[lang as keyof typeof labelList] : lang,
        syntax_mode: syntax_mode.toLowerCase(),
        variants: [
          {
            key: variant
          }
        ]
      };
    }
    else {
      langMap[lang].variants.push({ key: variant });
    }
  });

  supportedLanguages = Object.keys(langMap).map((lang) => langMap[lang]);
  return supportedLanguages;
}

export function convert(language: string, variant: string, request: Request, options: object, callback: Function) {
  let convert: Function | undefined, main;

  if (!Request.isRequest(request)) {
    return callback('Codegen~convert: Invalid request');
  }

  languageMap.forEach((codegen) => {
    const lang = codegen.lang.trim(), currentVariant = codegen.variant.trim();
    if (language.toLowerCase() === lang.toLowerCase() && variant.toLowerCase() === currentVariant.toLowerCase()) {
      main = codegen.main;
      convert = main.convert;

      if (typeof convert !== 'function') {
        return callback('Codegen~convert: Convert is not a function');
      }
    }
  });
  if (!convert) {
    return callback('Codegen~convert: Could not find codegen corresponding to provided language, variant pair');
  }

  try {
    convert(request, options, function (err: string, snippet: string) {
      if (err) {
        return callback(err);
      }

      return callback(null, snippet);
    });
  }
  catch (e) {
    return callback(e);
  }
}