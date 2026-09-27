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
  const [monaco, setMonaco] = useState<Monaco | null>(null);

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
          options={{
            ...editorOption,
            useShadowDOM: false,
            fontFamily: currentTheme.fontFamily,
            "semanticHighlighting.enabled": true,
          }}
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
  --line-number: var(--vscode-editorLineNumber-foreground);
  --line-number-active: var(--vscode-editorLineNumber-activeForeground);
  --line-highlight: var(--vscode-editor-lineHighlightBackground);
  --line-highlight-border: var(--vscode-editor-lineHighlightBorder);
  --indent-guide: var(--vscode-editorIndentGuide-background1);
  --indent-guide-active: var(--vscode-editorIndentGuide-activeBackground1);
  --fold: var(--vscode-editor-foldBackground);
  --caret: var(--vscode-editorCursor-foreground);
  --selection: var(--vscode-editor-selectionBackground);
  --sticky-border: var(--vscode-editorStickyScroll-border);
  --sticky-shadow: var(--vscode-editorStickyScroll-shadow);
  --scrollbar: var(--vscode-scrollbarSlider-background);
  --scrollbar-hover: var(--vscode-scrollbarSlider-hoverBackground);
  --scrollbar-active: var(--vscode-scrollbarSlider-activeBackground);
  --scrollbar-shadow: var(--vscode-scrollbar-shadow);
  --autocomplete: var(--vscode-editorSuggestWidget-background);
  --autocomplete-border: var(--vscode-editorSuggestWidget-border);
  --autocomplete-selected: var(--vscode-editorSuggestWidget-selectedBackground);
  --autocomplete-selected-foreground: var(--vscode-editorSuggestWidget-selectedForeground);
  --autocomplete-highlight: var(--vscode-editorSuggestWidget-highlightForeground);
  --autocomplete-focus-highlight: var(--vscode-editorSuggestWidget-focusHighlightForeground);
  --list-hover: var(--vscode-list-hoverBackground);
  --hover-widget: var(--vscode-editorHoverWidget-background);
  --hover-widget-foreground: var(--vscode-editorHoverWidget-foreground);
  --hover-widget-highlight: var(--vscode-editorHoverWidget-highlightForeground);
  --hover-widget-border: var(--vscode-editorHoverWidget-border);
  --hover-widget-status: var(--vscode-editorHoverWidget-statusBarBackground);
  --widget: var(--vscode-editorWidget-background);
  --widget-border: var(--vscode-editorWidget-border);
  --widget-shadow: var(--vscode-widget-shadow);
  --input: var(--vscode-input-background);
  --input-border: var(--vscode-input-border);
  --input-validation-info-border: var(--vscode-inputValidation-infoBorder);
  --quick-input: var(--vscode-quickInput-background);
  --quick-input-foreground: var(--vscode-quickInput-foreground);
  --quick-input-focus: var(--vscode-quickInputList-focusBackground);
  --menu: var(--vscode-menu-background);
  --menu-foreground: var(--vscode-menu-foreground);
  --menu-selection: var(--vscode-menu-selectionBackground);
  --menu-selection-border: var(--vscode-menu-selectionBorder);

  .monaco-editor,
  .monaco-editor-background,
  .margin-view-overlays,
  .zone-widget .monaco-scrollable-element {
    background-color: var(--background);
    color: var(--foreground);
  }

  .monaco-editor {
    .line-numbers {
      color: var(--line-number);
    }

    .line-numbers.active-line-number {
      color: var(--line-number-active);
    }

    .lines-content {
      .core-guide-indent {
        box-shadow: 1px 0 0 0 var(--indent-guide) inset;
      }

      .core-guide-indent.indent-active {
        box-shadow: 1px 0 0 0 var(--indent-guide-active) inset;
      }
    }

    .view-overlays {
      .current-line {
        background-color: var(--line-highlight);
      }

      .current-line-exact {
        border: var(--line-highlight-border);
      }

      .selected-text {
        background-color: var(--selection);
      }
    }

    .folded-background {
      background-color: var(--fold);
    }

    .cursors-layer .cursor {
      background-color: var(--caret);
      border-color: var(--caret);
    }

    .suggest-widget,
    .suggest-details {
      background-color: var(--autocomplete);
      border-color: var(--autocomplete-border);

      .monaco-sash {
        background-color: revert !important;
      }

      .monaco-list {
        .monaco-list-row {
          > .contents > .main .monaco-highlighted-label .highlight {
            color: var(--autocomplete-highlight);
          }
        }

        .monaco-list-row:hover {
          background-color: var(--list-hover);
        }

        .monaco-list-row.focused {
          background-color: var(--autocomplete-selected);
          color: var(--autocomplete-selected-foreground);

          > .contents > .main .monaco-highlighted-label .highlight {
            color: var(--autocomplete-focus-highlight);
          }
        }
      }
    }

    .monaco-editor-overlaymessage .message {
      color: var(--hover-widget-foreground);
      background-color: var(--hover-widget);
      border-color: var(--input-validation-info-border);
    }

    .monaco-hover,
    .parameter-hints-widget {
      background-color: var(--hover-widget);

      .signature .parameter.active {
        color: var(--hover-widget-highlight);
      }
    }

    .monaco-hover .hover-row .actions {
      background-color: var(--hover-widget-status);
    }

    .monaco-resizable-hover {
      border-color: var(--hover-widget-border);
    }

    .editor-widget {
      background-color: var(--widget);

      .monaco-inputbox {
        background-color: var(--input) !important;
      }

      .monaco-sash {
        background-color: var(--widget-border);
      }
    }

    .sticky-widget {
      border-bottom-color: var(--sticky-border);
      box-shadow: var(--sticky-shadow) 0 4px 2px -2px;

      .sticky-line-number,
      .sticky-line-content {
        color: var(--line-number);
      }

      .sticky-widget-line-numbers,
      .sticky-widget-lines-scrollable {
        background-color: var(--background);
      }
    }

    .quick-input-widget {
      background-color: var(--quick-input) !important;
      color: var(--quick-input-foreground) !important;
      box-shadow: 0 0 8px 2px var(--widget-shadow) !important;

      .monaco-scrollable-element > .shadow {
        box-shadow: var(--scrollbar-shadow) 0 6px 6px -6px inset;
      }

      .monaco-list-rows,
      .monaco-list-row {
        background-color: var(--quick-input);
      }

      .monaco-list-row.focused {
        background-color: var(--quick-input-focus);
      }

      .monaco-list-row:hover:not(.selected):not(.focused) {
        background-color: var(--list-hover);
      }

      .monaco-inputbox {
        background-color: var(--input) !important;
        border: none !important;
      }
    }
  }

  .monaco-menu {
    background-color: var(--menu);
    color: var(--menu-foreground);
    box-shadow: 0 2px 8px var(--widget-shadow);

    .action-item.focused .action-menu-item {
      background-color: var(--menu-selection) !important;
      outline-color: var(--menu-selection-border) !important;
    }
    
    .monaco-menu {
      .action-item .action-menu-item {
        background-color: var(--menu) !important;
        outline: none !important;
      }

      .action-item.focused .action-menu-item {
        background-color: var(--menu-selection) !important;
        outline-color: var(--menu-selection-border) !important;
      }
    }
  }

  .monaco-scrollable-element > .scrollbar {
    & > .slider {
      background: var(--scrollbar);
    }

    & > .slider:hover {
      background: var(--scrollbar-hover);
    }

    & > .slider.active {
      background: var(--scrollbar-active);
    }
  }

  .context-view.monaco-component .monaco-hover {
    color: var(--hover-widget-foreground);
    background-color: var(--hover-widget);
    border-color: var(--hover-widget-border);
    box-shadow: 0 2px 8px var(--widget-shadow);
  }

  .context-view.monaco-component .workbench-hover-pointer:after {
    background-color: var(--hover-widget);
    border-right-color: var(--hover-widget-border);
    border-bottom-color: var(--hover-widget-border);
  }
`;

export default CodeEditor;