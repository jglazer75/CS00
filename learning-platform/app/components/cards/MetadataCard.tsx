'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import StopIcon from '@mui/icons-material/Stop';
import type { Keyword, PageMetadata } from '@/lib/content';

type MetadataCardProps = {
  metadata: PageMetadata;
};

function BlueprintSection({ title, items, Icon }: { title: string; items: string[]; Icon: React.ElementType }) {
  const theme = useTheme();
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
        <Icon sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
        <Typography variant="h6" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>
          {title}
        </Typography>
      </Stack>
      <Stack spacing={1.5}>
        {items.map((item, i) => (
          <Box key={i} display="flex" alignItems="flex-start">
            <HorizontalRuleIcon sx={{ color: alpha(theme.palette.text.secondary, 0.3), mr: 1.5, mt: '2px', fontSize: 16, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary">{item}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function KeywordSection({ keywords }: { keywords: Keyword[] }) {
  const theme = useTheme();
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
        <HorizontalRuleIcon sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
        <Typography variant="h6" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>
          Lexicon
        </Typography>
      </Stack>
      <Stack spacing={2}>
        {keywords.map((kw) => (
          <Box key={kw.term}>
            <Box display="flex" alignItems="flex-start">
              <HorizontalRuleIcon sx={{ color: alpha(theme.palette.text.secondary, 0.3), mr: 1.5, mt: '2px', fontSize: 16, flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {kw.term}
                </Typography>
                {kw.definition && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {kw.definition}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default function MetadataCard({ metadata }: MetadataCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { learningObjectives, coreConcepts, keywords } = metadata;

  const content = (
    <Grid container spacing={0}>
      {learningObjectives.length > 0 && (
        <Grid size={{ xs: 12, md: 4 }} sx={{ border: `1px solid ${theme.palette.divider}`, m: '-1px' }}>
          <BlueprintSection title="Objectives" items={learningObjectives} Icon={ChangeHistoryIcon} />
        </Grid>
      )}
      {coreConcepts.length > 0 && (
        <Grid size={{ xs: 12, md: 4 }} sx={{ border: `1px solid ${theme.palette.divider}`, m: '-1px' }}>
          <BlueprintSection title="Concepts" items={coreConcepts} Icon={StopIcon} />
        </Grid>
      )}
      {keywords.length > 0 && (
        <Grid size={{ xs: 12, md: 4 }} sx={{ border: `1px solid ${theme.palette.divider}`, m: '-1px' }}>
          <KeywordSection keywords={keywords} />
        </Grid>
      )}
    </Grid>
  );

  if (isMobile) {
    return (
      <Accordion elevation={0} sx={{ border: `2px solid ${theme.palette.primary.main}`, mb: 4, bgcolor: 'background.paper', borderRadius: 0 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />} sx={{ px: 3 }}>
          <Typography variant="h6" color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Lesson Schema
          </Typography>
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
}
