'use client';

import { Box, Divider, Stack, Typography, alpha, useTheme } from '@mui/material';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import MarkdownContent from '../MarkdownContent';

type InstructorNoteCardProps = {
  title?: string;
  html: string;
};

export default function InstructorNoteCard({ title = 'Instructor Notes', html }: InstructorNoteCardProps) {
  const theme = useTheme();

  return (
    <Box
      component="aside"
      sx={{
        border: `2px solid ${theme.palette.text.primary}`,
        my: 6,
        position: 'relative',
        bgcolor: 'background.paper',
        '&::after': {
          content: '"CONFIDENTIAL / INSTRUCTOR ONLY"',
          position: 'absolute',
          top: 10,
          right: 10,
          fontFamily: '"Montserrat", sans-serif',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#d32f2f',
          border: '1px solid #d32f2f',
          p: '2px 6px',
          transform: 'rotate(5deg)',
          opacity: 0.8,
          display: { xs: 'none', sm: 'block' },
        },
      }}
    >
      <Stack direction="row" spacing={0}>
        <Box sx={{ bgcolor: 'text.primary', color: 'background.paper', p: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <BorderColorIcon />
        </Box>
        <Box sx={{ p: 3, flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Pedagogical Note{' '}
            <span style={{ color: alpha('#000', 0.3) }}>| Ref: {title}</span>
          </Typography>
          <Divider sx={{ my: 1.5, borderColor: alpha('#000', 0.1) }} />
          <MarkdownContent html={html} />
        </Box>
      </Stack>
    </Box>
  );
}
