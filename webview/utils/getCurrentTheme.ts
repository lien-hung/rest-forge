import { OPTION } from "../constants";
import { IEditorTheme } from "./type";

const getCurrentTheme = (): IEditorTheme => {
  const currentEditor = document.documentElement;
  const currentBody = currentEditor.querySelector("body");
  if (!currentEditor || !currentBody) {
    return {
      base: "vs-dark",
      colors: {},
      fontFamily: OPTION.EDITOR_DEFAULT_FONT_FAMILY
    };
  }

  const editorStyles = getComputedStyle(currentEditor);
  const bodyStyles = getComputedStyle(currentBody);

  // Theme base
  const themeBase = currentBody.classList.contains("vscode-light") ? "vs" : "vs-dark";

  // Theme colors (partial)
  const themeColors = {
    // Foreground and background
    "foreground": editorStyles.getPropertyValue("--vscode-foreground"),
    "editor.background": editorStyles.getPropertyValue("--vscode-editor-background"),

    // Cursor
    "editorCursor.foreground": editorStyles.getPropertyValue("--vscode-editorCursor-foreground"),

    // Line numbers
    "editorLineNumber.foreground": editorStyles.getPropertyValue("--vscode-editorLineNumber-foreground"),
    "editorLineNumber.activeForeground": editorStyles.getPropertyValue("--vscode-editorLineNumber-activeForeground"),

    // Suggest widget (IntelliSense)
    "editorSuggestWidget.background": editorStyles.getPropertyValue("--vscode-editorSuggestWidget-background"),
    "editorSuggestWidget.focusHighlightForeground": editorStyles.getPropertyValue("--vscode-editorSuggestWidget-focusHighlightForeground"),
    "editorSuggestWidget.highlightForeground": editorStyles.getPropertyValue("--vscode-editorSuggestWidget-highlightForeground"),

    // Sticky scroll
    "editorStickyScroll.shadow": "#00000022",

    // Hover widget (variable/prop/method info etc.)
    "editorHoverWidget.background": editorStyles.getPropertyValue("--vscode-editorHoverWidget-background"),
    "editorHoverWidget.focusHighlightForeground": editorStyles.getPropertyValue("--vscode-editorHoverWidget-focusHighlightForeground"),
    "editorHoverWidget.highlightForeground": editorStyles.getPropertyValue("--vscode-editorHoverWidget-highlightForeground"),
  };

  // Font family
  const currentFontFamily = bodyStyles.getPropertyValue("--vscode-editor-font-family");

  return {
    base: themeBase,
    colors: themeColors,
    fontFamily: currentFontFamily
  };
};

export default getCurrentTheme;