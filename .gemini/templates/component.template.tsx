import React from 'react';
import { Box, Typography } from '@mui/material';

export interface TemplateProps {
  title: string;
  children?: React.ReactNode;
}

/**
 * [Description of component purpose]
 */
export const TemplateComponent: React.FC<TemplateProps> = ({ title, children }) => {
  return (
    <Box className="p-4 border rounded-lg bg-surface">
      <Typography variant="h6" className="font-bold text-primary">
        {title}
      </Typography>
      <Box className="mt-2">
        {children}
      </Box>
    </Box>
  );
};
