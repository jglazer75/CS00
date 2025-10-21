'use client';

import { Box } from '@mui/material';

type MarkdownContentProps = {
  html: string;
};

export default function MarkdownContent({ html }: MarkdownContentProps) {
  return (
    <Box
      className="markdown-content"
      sx={{
        '& h2, & h3, & h4, & h5, & h6': {
          fontWeight: 600,
          marginTop: 2,
        },
        '& p': {
          marginBottom: 2,
        },
        '& ul, & ol': {
          paddingLeft: 3,
          marginBottom: 2,
        },
        '& a': {
          color: 'primary.main',
          textDecoration: 'underline',
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          paddingLeft: 2,
          margin: 0,
          marginBottom: 2,
          fontStyle: 'italic',
          backgroundColor: 'rgba(0, 45, 90, 0.04)',
        },
        '& .key-concept': {
          borderLeft: '4px solid',
          borderColor: 'warning.main',
          backgroundColor: 'rgba(253, 184, 19, 0.12)',
          padding: 2,
          borderRadius: 1,
          marginBottom: 2,
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: 2,
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          padding: 1,
          textAlign: 'left',
        },
        '& code': {
          fontSize: '0.9rem',
          backgroundColor: 'rgba(33, 33, 33, 0.08)',
          padding: '0.125rem 0.375rem',
          borderRadius: 1,
        },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
