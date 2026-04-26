import { Editor, Monaco } from "@monaco-editor/react";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { COMMON, OPTION, REQUEST, RESPONSE } from "../constants";
import ResponsePreview from "../features/Response/Preview/ResponsePreview";
import { getCurrentTheme } from "../utils";
import { IEditorTheme, ITokenColor } from "../utils/type";

interface ICodeEditorProps {
  language: string;
  viewOption?: string;
  requestForm?: boolean;
  previewMode?: boolean;
  editorOption: any;
  codeEditorValue: string;
  shouldBeautifyEditor?: boolean;
  handleEditorChange?: (value: string | undefined) => void;
  handleBeautifyButton?: () => void;
}

function CodeEditor({
  language,
  viewOption,
  requestForm,
  previewMode,
  editorOption,
  codeEditorValue,
  shouldBeautifyEditor,
  handleEditorChange,
  handleBeautifyButton,
}: ICodeEditorProps) {
  const [editor, setEditor] = useState<any>(null);
  const [monaco, setMonaco] = useState<Monaco>(null);

  const [currentTheme, setCurrentTheme] = useState<IEditorTheme>({
    base: "vs-dark",
    fontFamily: OPTION.EDITOR_DEFAULT_FONT_FAMILY
  });
  const [tokenColors, setTokenColors] = useState<ITokenColor[]>([]);

  const setEditorTheme = () => {
    if (!monaco) return;

    monaco.editor.defineTheme("currentTheme", {
      base: currentTheme.base,
      inherit: true,
      rules: tokenColors,
      colors: {},
    });
    monaco.editor.setTheme("currentTheme");
  }

  const handleEditorWillMount = (monaco: Monaco) => {
    setMonaco(monaco);
    setCurrentTheme(getCurrentTheme());
  }

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editor.updateOptions({ useShadowDOM: false });
    editor.addAction({
      id: 'custom-paste',
      label: 'Paste',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
      precondition: 'editorTextFocus && !findInputFocused',
      run: async (editor: any) => {
        try {
          const text = await navigator.clipboard.readText();
          const model = editor.getModel();
          const selection = editor.getSelection();
          if (!model || !selection) return;

          editor.executeEdits('clipboard-paste', [
            {
              range: selection,
              text,
              forceMoveMarkers: true,
            },
          ]);

          editor.pushUndoStop();
          editor.focus();
        } catch (err) {
          console.error('Paste failed:', err);
        }
      },
    });
    
    setEditor(editor);
  };

  const handleExtensionMessage = (event: MessageEvent) => {
    if (event.data.type === COMMON.THEME_CHANGED || event.data.type === COMMON.HAS_TOKEN_COLORS) {
      setTokenColors(event.data.tokenColors);
      setCurrentTheme(getCurrentTheme());
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleExtensionMessage);
    vscode.postMessage({ command: COMMON.INIT_TOKEN_COLORS });
  }, []);

  useEffect(() => setEditorTheme(), [currentTheme, tokenColors]);

  useEffect(() => {
    if (!editor || requestForm) return;
    editor.trigger("editor", "editor.action.formatDocument");
  }, [editor, codeEditorValue]);

  useEffect(() => {
    if (shouldBeautifyEditor && requestForm) {
      if (handleBeautifyButton) {
        handleBeautifyButton();
      }

      setTimeout(async () => {
        await editor.getAction("editor.action.formatDocument").run();
      }, 200);
    }
  }, [shouldBeautifyEditor]);

  useEffect(() => {
    if (requestForm || !previewMode || viewOption === RESPONSE.PREVIEW) return;

    if (editor?.getValue() !== codeEditorValue) {
      editor?.setValue(codeEditorValue);
    }

    setTimeout(async () => {
      editor?.updateOptions(OPTION.READ_ONLY_FALSE_OPTION);

      await editor?.getAction("editor.action.formatDocument").run();

      if (viewOption === REQUEST.RAW) {
        editor?.updateOptions(OPTION.LINE_NUMBER_OPTION);
      } else {
        editor?.updateOptions(OPTION.READ_ONLY_TRUE_OPTION);
      }
    }, 500);
  }, [viewOption, language]);

  return (
    <EditorWrapper>
      {viewOption === RESPONSE.PREVIEW && previewMode ? (
        <ResponsePreview
          sourceCode={codeEditorValue.startsWith("blob:vscode-webview://")
            ? `<!DOCTYPE html><style>* { margin: 0; width: 100%; height: calc(100% - 1.5px); }</style><object data="${codeEditorValue}"></object>`
            : codeEditorValue
          }
        />
      ) : (
        <Editor
          language={language}
          value={codeEditorValue}
          options={{ ...editorOption, fontFamily: currentTheme.fontFamily }}
          onChange={handleEditorChange}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
        />
      )}
    </EditorWrapper>
  );
};

const EditorWrapper = styled.div`
  --background: var(--vscode-editor-background);
  --foreground: var(--vscode-editor-foreground);
  --caretColor: var(--vscode-editorCursor-foreground);
  --input-background: var(--vscode-input-background);
  --lineHighlightBackground: var(--vscode-editor-lineHighlightBackground);
  --lineHighlightBorder: var(--vscode-editor-lineHighlightBorder);
  --lineNumber-foreground: var(--vscode-editorLineNumber-foreground);
  --lineNumber-activeForeground: var(--vscode-editorLineNumber-activeForeground);
  --hoverWidget-background: var(--vscode-editorHoverWidget-background);
  --hoverWidget-highlightForeground: var(--vscode-editorHoverWidget-highlightForeground);
  --suggestWidget-border: var(--vscode-editorSuggestWidget-border);
  --suggestWidget-background: var(--vscode-editorSuggestWidget-background);
  --suggestWidget-selectedBackground: var(--vscode-editorSuggestWidget-selectedBackground);
  --suggestWidget-selectedForeground: var(--vscode-editorSuggestWidget-selectedForeground);
  --suggestWidget-highlightForeground: var(--vscode-editorSuggestWidget-highlightForeground);
  --suggestWidget-focusHighlightForeground: var(--vscode-editorSuggestWidget-focusHighlightForeground);
  --stickyScroll-border: var(--vscode-editorStickyScroll-border);
  --stickyScroll-shadow: var(--vscode-editorStickyScroll-shadow);
  --menu-background: var(--vscode-menu-background);
  --menu-foreground: var(--vscode-menu-foreground);
  --menu-selectionBackground: var(--vscode-menu-selectionBackground);
  --menu-selectionBorder: var(--vscode-menu-selectionBorder);
  --scrollbar-shadow: var(--vscode-scrollbar-shadow);
  --quickInput-background: var(--vscode-quickInput-background);
  --quickInput-foreground: var(--vscode-quickInput-foreground);
  --quickInputList-focusBackground: var(--vscode-quickInputList-focusBackground);
  --widget-shadow: var(--vscode-widget-shadow);

  .monaco-editor,
  .monaco-editor-background,
  .margin-view-overlays {
    background-color: var(--background);
    color: var(--foreground);
  }

  .monaco-editor {
    .line-numbers {
      color: var(--lineNumber-foreground);
    }

    .line-numbers.active-line-number {
      color: var(--lineNumber-activeForeground);
    }

    .view-overlays {
      .current-line {
        background-color: var(--lineHighlightBackground);
      }

      .current-line-exact {
        border: var(--lineHighlightBorder);
      }
    }

    .cursors-layer .cursor {
      background-color: var(--caretColor);
      border-color: var(--caretColor);
    }

    .suggest-widget,
    .suggest-details {
      border: 1px solid var(--suggestWidget-border);
      background-color: var(--suggestWidget-background);

      .monaco-list {
        .monaco-list-row {
          > .contents > .main .monaco-highlighted-label .highlight {
            color: var(--suggestWidget-highlightForeground);
          }
        }

        .monaco-list-row.focused {
          background-color: var(--suggestWidget-selectedBackground);
          color: var(--suggestWidget-selectedForeground);

          > .contents > .main .monaco-highlighted-label .highlight {
            color: var(--suggestWidget-focusHighlightForeground);
          }
        }
      }
    }

    .monaco-hover, .parameter-hints-widget {
      background-color: var(--hoverWidget-background);

      .signature .parameter.active {
        color: var(--hoverWidget-highlightForeground);
      }
    }

    .sticky-widget {
      border-bottom-color: var(--stickyScroll-border);
      box-shadow: var(--stickyScroll-shadow) 0 4px 2px -2px;

      .sticky-line-number,
      .sticky-line-content {
        color: var(--lineNumber-foreground);
      }

      .sticky-widget-line-numbers,
      .sticky-widget-lines-scrollable {
        background-color: var(--background);
      }
    }

    .quick-input-widget {
      color: var(--quickInput-foreground) !important;
      background-color: var(--quickInput-background) !important;
      box-shadow: 0 0 8px 2px var(--widget-shadow) !important;

      .monaco-scrollable-element > .shadow {
        box-shadow: var(--scrollbar-shadow) 0 6px 6px -6px inset;
      }

      .monaco-list-row {
        background-color: var(--quickInput-background);
      }

      .monaco-list-row.focused {
        background-color: var(--quickInputList-focusBackground);
      }

      .monaco-inputbox {
        background-color: var(--input-background) !important;
      }
    }
  }

  .monaco-menu {
    color: var(--menu-foreground);
    background-color: var(--menu-background);
    box-shadow: 0 2px 8px var(--widget-shadow);

    .action-item.focused .action-menu-item {
      background-color: var(--menu-selectionBackground) !important;
      outline: 1px solid var(--menu-selectionBorder) !important;
    }
    
    .monaco-menu {
      .action-item .action-menu-item {
        background-color: var(--menu-background) !important;
        outline: none !important;
      }

      .action-item.focused .action-menu-item {
        background-color: var(--menu-selectionBackground) !important;
        outline: 1px solid var(--menu-selectionBorder) !important;
      }
    }
  }
`;

export default CodeEditor;