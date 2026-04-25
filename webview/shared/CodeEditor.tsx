import { Editor, Monaco } from "@monaco-editor/react";
import React, { useEffect, useRef, useState } from "react";
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
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco>(null);

  const [currentTheme, setCurrentTheme] = useState<IEditorTheme>({
    base: "vs-dark",
    colors: {},
    fontFamily: OPTION.EDITOR_DEFAULT_FONT_FAMILY
  });
  const [tokenColors, setTokenColors] = useState<ITokenColor[]>([]);

  const setEditorTheme = () => {
    if (!monacoRef.current) return;

    monacoRef.current.editor.defineTheme("currentTheme", {
      base: currentTheme.base,
      inherit: true,
      rules: tokenColors,
      colors: currentTheme.colors,
    });
    monacoRef.current.editor.setTheme("currentTheme");
  }

  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco;
    setCurrentTheme(getCurrentTheme());
  }

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
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
    
    editorRef.current = editor;
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
    if (shouldBeautifyEditor && requestForm) {
      if (handleBeautifyButton) {
        handleBeautifyButton();
      }

      setTimeout(async () => {
        await editorRef.current.getAction("editor.action.formatDocument").run();
      }, 200);
    }
  }, [shouldBeautifyEditor]);

  useEffect(() => {
    if (requestForm || !previewMode || viewOption === RESPONSE.PREVIEW) return;

    if (editorRef.current?.getValue() !== codeEditorValue) {
      editorRef.current?.setValue(codeEditorValue);
    }

    setTimeout(async () => {
      editorRef.current?.updateOptions(OPTION.READ_ONLY_FALSE_OPTION);

      await editorRef.current?.getAction("editor.action.formatDocument").run();

      if (viewOption === REQUEST.RAW) {
        editorRef.current?.updateOptions(OPTION.LINE_NUMBER_OPTION);
      } else {
        editorRef.current?.updateOptions(OPTION.READ_ONLY_TRUE_OPTION);
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
  --lineHighlightBackground: var(--vscode-editor-lineHighlightBackground);
  --lineHighlightBorder: var(--vscode-editor-lineHighlightBorder);
  --lineNumber-foreground: var(--vscode-editorLineNumber-foreground);
  --lineNumber-activeForeground: var(--vscode-editorLineNumber-activeForeground);
  --suggestWidget-border: var(--vscode-editorSuggestWidget-border);
  --suggestWidget-background: var(--vscode-editorSuggestWidget-background);
  --suggestWidget-selectedBackground: var(--vscode-editorSuggestWidget-selectedBackground);
  --suggestWidget-selectedForeground: var(--vscode-editorSuggestWidget-selectedForeground);
  --stickyScroll-border: var(--vscode-editorStickyScroll-border);
  --stickyScroll-shadow: var(--vscode-editorStickyScroll-shadow);

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

    .suggest-widget,
    .suggest-details {
      border: 1px solid var(--suggestWidget-border);
      background-color: var(--suggestWidget-background);

      .monaco-list .monaco-list-row.focused {
        background-color: var(--suggestWidget-selectedBackground);
        color: var(--suggestWidget-selectedForeground);
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
  }
`;

export default CodeEditor;