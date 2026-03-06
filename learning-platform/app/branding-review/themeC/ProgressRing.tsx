import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';

export interface ProgressRingProps {
  percent: number;
  size?: number;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ percent, size = 80, label }) => {
  const theme = useTheme();
  const cappedPercent = Math.min(100, Math.max(0, percent));
  
  const strokeWidth = 8;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (cappedPercent / 100) * circumference;

  return (
    <Box sx={{ display: 'inline-flex', position: 'relative', p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }} aria-label={`Status: ${cappedPercent}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={alpha(theme.palette.primary.main, 0.1)}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={theme.palette.secondary.main}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: 'absolute', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          p: 2
        }}
      >
        <Typography variant="h5" component="div" sx={{ color: 'text.primary', fontWeight: 700, fontFamily: '"Montserrat", sans-serif', lineHeight: 1 }}>
          {`${Math.round(cappedPercent)}%`}
        </Typography>
        {label && (
          <Typography variant="caption" color="primary.main" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem', mt: 0.5, letterSpacing: '0.1em' }}>
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  );
};