import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { WIDTH } from "../../constants";
import useStore from "../../store/useStore";
import { useShallow } from "zustand/shallow";

const ResizeBar = () => {
  const { requestMenuWidth, handleRequestWidthChange } = useStore(
    useShallow((state) => ({
      requestMenuWidth: state.requestMenuWidth,
      handleRequestWidthChange: state.handleRequestWidthChange,
    })),
  );

  const [isDragging, setIsDragging] = useState(false);
  const [resizeBarX, setResizeBarX] = useState(0);

  const editorElement = document.querySelector(".editor-container") || document.documentElement;
  const editorDimensions = editorElement.getBoundingClientRect();

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();

    setResizeBarX(event.clientX);
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (isDragging && resizeBarX) {
      const currentWidth = Number(requestMenuWidth.replace("%", ""));
      const newWidth = currentWidth + ((event.clientX - resizeBarX) / editorDimensions.width) * 100;

      if (
        newWidth >= WIDTH.MINIMUM_WIDTH &&
        newWidth <= WIDTH.MAXIMUM_WIDTH
      ) {
        setResizeBarX(newWidth);
        handleRequestWidthChange(newWidth);
      }
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <ResizeBarHitBox onMouseDown={handleMouseDown} />
  );
};

const ResizeBarHitBox = styled.div`
  flex: 0 0 2px;
  margin: 0 0.5px;
  height: 100vh;
  background: rgba(128, 128, 128, 0.7);
  cursor: ew-resize;

  &:hover {
    flex: 0 0 3px;
    margin: 0;
  }
`;

export default ResizeBar;
