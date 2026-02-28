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

  const handleEditorDidMount = (editor: any) => {
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

  useEffect(() => setEditorTheme(), [currentTheme]);

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
  flex: 1 1 auto;

  .monaco-editor {
    .view-overlays {
      .current-line {
        background-color: var(--vscode-editor-lineHighlightBackground);
      }

      .current-line-exact {
        border: var(--vscode-editor-lineHighlightBorder);
      }
    }

    .suggest-widget {
      border: var(--vscode-editorSuggestWidget-border);

      .monaco-list .monaco-list-row.focused {
        background-color: color-mix(in srgb, var(--vscode-editor-background) 90%, var(--vscode-foreground));
        color: var(--vscode-editorSuggestWidget-selectedForeground);
      }
    }
  }
`;

export default CodeEditor;