import React from 'react';
import { Alert, AlertTitle, Typography, alpha, useTheme } from '@mui/material';
import LockPersonIcon from '@mui/icons-material/LockPerson';

export interface InstructorNoteCardProps {
  note: string;
  pageTitle: string;
}

export const InstructorNoteCard: React.FC<InstructorNoteCardProps> = ({ note, pageTitle }) => {
  const theme = useTheme();

  return (
    <Alert 
      icon={<LockPersonIcon sx={{ color: theme.palette.secondary.main }} />}
      sx={{ 
        bgcolor: alpha(theme.palette.secondary.main, 0.05),
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        borderRadius: theme.shape.borderRadius,
        my: 4,
        alignItems: 'center'
      }}
    >
      <AlertTitle sx={{ fontWeight: 700, color: theme.palette.secondary.main, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.75rem' }}>
        Instructor Note — context: {pageTitle}
      </AlertTitle>
      <Typography variant="body2" sx={{ color: 'text.primary', '& em': { fontStyle: 'italic', opacity: 0.8 } }}>
        {note}
      </Typography>
    </Alert>
  );
};