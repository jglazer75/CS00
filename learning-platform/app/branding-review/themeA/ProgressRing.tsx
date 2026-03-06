import React from 'react';
import { Box, Typography, CircularProgress, alpha, useTheme, keyframes } from '@mui/material';

export interface ProgressRingProps {
  percent: number;
  size?: number;
  label?: string;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

export const ProgressRing: React.FC<ProgressRingProps> = ({ percent, size = 60, label }) => {
  const theme = useTheme();
  const cappedPercent = Math.min(100, Math.max(0, percent));

  return (
    <Box sx={{ display: 'inline-flex', position: 'relative', animation: `${fadeIn} 0.5s ease-out` }} aria-label={`Completion: ${cappedPercent}%`}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={5}
        sx={{ color: alpha(theme.palette.primary.main, 0.05) }}
      />
      <CircularProgress
        variant="determinate"
        value={cappedPercent}
        size={size}
        thickness={5}
        sx={{
          color: theme.palette.secondary.main,
          position: 'absolute',
          left: 0,
          circle: { transition: 'stroke-dashoffset 1s ease-in-out' },
        }}
      />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: 'absolute', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography variant="h6" component="div" sx={{ color: theme.palette.primary.main, fontWeight: 700, lineHeight: 1 }}>
          {`${Math.round(cappedPercent)}%`}
        </Typography>
        {label && (
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem', mt: -0.5 }}>
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  );
};