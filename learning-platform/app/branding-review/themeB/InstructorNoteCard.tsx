import React from 'react';
import { Card, CardContent, Typography, Box, alpha, useTheme, Avatar } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';

export interface InstructorNoteCardProps {
  note: string;
  pageTitle: string;
}

export const InstructorNoteCard: React.FC<InstructorNoteCardProps> = ({ note, pageTitle }) => {
  const theme = useTheme();
  const neutralGrey = '#F3F4F6';

  return (
    <Card 
      elevation={0}
      sx={{ 
        bgcolor: neutralGrey,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 4,
        my: 4,
        position: 'relative',
        overflow: 'visible'
      }}
    >
      <CardContent sx={{ p: 4, pt: 5 }}>
        <Avatar sx={{ 
            bgcolor: 'text.primary', 
            width: 50, height: 50, 
            position: 'absolute', 
            top: -25, right: 32,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
            <PsychologyIcon sx={{ fontSize: 30, color: theme.palette.success.main }} />
        </Avatar>

        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          Instructor Insight
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom mb={2}>
          Context: {pageTitle}
        </Typography>
        
        <Box sx={{ 
            pl: 2, 
            borderLeft: `2px solid ${alpha(theme.palette.text.primary, 0.1)}`,
            typography: 'body2', 
            color: 'text.primary',
            '& strong': { fontWeight: 600, color: 'success.main' }
        }}>
          {note}
        </Box>
      </CardContent>
    </Card>
  );
};