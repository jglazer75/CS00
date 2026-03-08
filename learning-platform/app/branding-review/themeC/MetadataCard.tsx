import React from 'react';
import { Typography, Box, Stack, alpha, useTheme, Accordion, AccordionSummary, AccordionDetails, useMediaQuery, Paper, Grid } from '@mui/material';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import StopIcon from '@mui/icons-material/Stop';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface MetadataCardProps {
  learningObjectives: string[];
  coreConcepts: string[];
  keywords: string[];
}

const BlueprintSection: React.FC<{ title: string; items: string[]; Icon: React.ElementType }> = ({ title, items, Icon }) => {
    const theme = useTheme();
    return (
        <Box sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
                <Icon sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                <Typography variant="h6" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', fontFamily: '"Montserrat", sans-serif' }}>
                    {title}
                </Typography>
            </Stack>
            <Stack spacing={1.5}>
                {items.map(item => (
                    <Box key={item} display="flex" alignItems="start">
                        <HorizontalRuleIcon sx={{ color: alpha(theme.palette.text.secondary, 0.3), mr: 1.5, mt: '2px', fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                            {item}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

export const MetadataCard: React.FC<MetadataCardProps> = ({ learningObjectives, coreConcepts, keywords }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const content = (
    <Grid container spacing={0}>
        <Grid size={{ xs: 12, md: 4 }} sx={{ border: `1px solid ${theme.palette.divider}`, m: '-1px' }}>
            <BlueprintSection title="Objectives" items={learningObjectives} Icon={ChangeHistoryIcon} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ border: `1px solid ${theme.palette.divider}`, m: '-1px' }}>
            <BlueprintSection title="Concepts" items={coreConcepts} Icon={StopIcon} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ border: `1px solid ${theme.palette.divider}`, m: '-1px' }}>
            <BlueprintSection title="Lexicon" items={keywords} Icon={HorizontalRuleIcon} />
        </Grid>
    </Grid>
  );

  if (isMobile) {
    return (
      <Accordion elevation={0} sx={{ border: `2px solid ${theme.palette.primary.main}`, mb: 4, bgcolor: 'background.paper', borderRadius: 0 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />} sx={{ px: 3 }}>
          <Typography variant="h6" color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"Montserrat", sans-serif' }}>Lesson Schema</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>{content}</AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Paper elevation={0} sx={{ my: 6, bgcolor: 'background.paper', p: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
      {content}
    </Paper>
  );
};