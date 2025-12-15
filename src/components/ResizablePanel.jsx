import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import '../api/apiConfig';

export default function ResizablePanels({ leftPanel, rightPanel, initialLeftWidth = 300, sx }) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const isResizing = useRef(false);

  const handleMouseDown = (e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = Math.max(200, e.clientX);
    setLeftWidth(newWidth);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100vh', overflow: 'hidden', ...sx }}>
      <Box
        sx={{
          width: leftWidth,
          flexShrink: 0,
          borderRight: '1px solid #e0e0e0',
          overflowY: 'auto',
          height: '100%',
        }}
      >
        {leftPanel}
      </Box>
      <Box
        sx={{
          width: '8px',
          cursor: 'ew-resize',
          backgroundColor: '#f0f0f0',
          '&:hover': {
            backgroundColor: '#e0e0e0',
          },
        }}
        onMouseDown={handleMouseDown}
      />
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          height: '100%',
          minHeight: 0,
        }}
      >
        {rightPanel}
      </Box>
    </Box>
  );
}