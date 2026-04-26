import { OPTION } from "../constants";
import { IEditorTheme } from "./type";

const getCurrentTheme = (): IEditorTheme => {
  const currentEditor = document.documentElement;
  const currentBody = currentEditor.querySelector("body");
  if (!currentEditor || !currentBody) {
    return {
      base: "vs-dark",
      fontFamily: OPTION.EDITOR_DEFAULT_FONT_FAMILY
    };
  }

  const bodyStyles = getComputedStyle(currentBody);
  const themeBase = currentBody.classList.contains("vscode-light") ? "vs" : "vs-dark";
  const currentFontFamily = bodyStyles.getPropertyValue("--vscode-editor-font-family");

  return {
    base: themeBase,
    fontFamily: currentFontFamily
  };
};

export default getCurrentTheme;