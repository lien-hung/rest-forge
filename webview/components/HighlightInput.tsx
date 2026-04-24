import React, { InputHTMLAttributes, useEffect, useRef } from "react";
import useStore from "../store/useStore";
import styled from "styled-components";

const HighlightInput = ({
  name,
  placeholder,
  value,
  readOnly,
  onChange,
  onScroll,
  onInput,
}: InputHTMLAttributes<HTMLInputElement>) => {
  const variables = useStore((state) => state.activeVariables);
  const previewRef = useRef<HTMLParagraphElement>(null);

  const setVariableHighlight = () => {
    let variableHighlight = CSS.highlights.get("variable-highlight");
    let nonVariableHighlight = CSS.highlights.get("non-variable-highlight");

    const inputValue = `${value}`;
    const matches = [...inputValue.matchAll(/\{\{([^}]+)\}\}/gi)];
    const stripBracket = (s: string) => s.replace("{{", "").replace("}}", "");

    const validMatches = matches.filter(match => variables[stripBracket(match[0])]);
    const invalidMatches = matches.filter(match => !variables[stripBracket(match[0])]);
    const rangeCallback = (match: RegExpExecArray) => {
      const range = new Range();
      if (previewRef.current) {
        const textNode = previewRef.current.firstChild;
        range.setStart(textNode!, match.index);
        range.setEnd(textNode!, match.index + match[0].length);
      }
      return range;
    }

    const variableRanges = validMatches.map(rangeCallback);
    if (variableHighlight) {
      for (const range of variableRanges) {
        if (!variableHighlight.has(range)) {
          variableHighlight.add(range);
        }
      }
    } else {
      variableHighlight = new Highlight(...variableRanges);
    }
    CSS.highlights.set("variable-highlight", variableHighlight);

    const nonVariableRanges = invalidMatches.map(rangeCallback);
    if (nonVariableHighlight) {
      for (const range of nonVariableRanges) {
        if (!nonVariableHighlight.has(range)) {
          nonVariableHighlight.add(range);
        }
      }
    } else {
      nonVariableHighlight = new Highlight(...nonVariableRanges);
    }
    CSS.highlights.set("non-variable-highlight", nonVariableHighlight);
  };

  useEffect(() => setVariableHighlight(), [value]);

  return (
    <HighlightInputWrapper>
      <p className="preview" ref={previewRef}>{value}</p>
      <input
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange}
        onScroll={onScroll}
        onInput={onInput}
      />
    </HighlightInputWrapper>
  )
};

const HighlightInputWrapper = styled.div`
  flex: 1;
  position: relative;
  
  .preview {
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: scroll hidden;
    scrollbar-width: none;
    pointer-events: none;
  }

  input {
    position: relative;
    background: transparent;
    color: transparent;
    caret-color: var(--vscode-foreground);
  }
`;

export default HighlightInput;