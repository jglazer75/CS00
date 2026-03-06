import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';

export interface ProgressRingProps {
  percent: number;
  size?: number;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ percent, size = 70, label }) => {
  const theme = useTheme();
  const [drawingValue, setDrawingValue] = useState(0);
  const cappedPercent = Math.min(100, Math.max(0, percent));
  const neutralGrey = '#F3F4F6';

  useEffect(() => {
    const timer = setTimeout(() => {
        setDrawingValue(cappedPercent);
    }, 200);
    return () => clearTimeout(timer);
  }, [cappedPercent]);

  return (
    <Box sx={{ display: 'inline-flex', position: 'relative' }} aria-label={`Module completion: ${cappedPercent}%`}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={6}
        sx={{ color: neutralGrey }}
      />
      <CircularProgress
        variant="determinate"
        value={drawingValue}
        size={size}
        thickness={6}
        color="primary"
        sx={{
          position: 'absolute',
          left: 0,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: 'absolute', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography variant="h5" component="div" sx={{ color: 'text.primary', fontWeight: 700, lineHeight: 1 }}>
          {`${Math.round(cappedPercent)}%`}
        </Typography>
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', mt: 0.5 }}>
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  );
};