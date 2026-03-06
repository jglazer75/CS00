import React from 'react';
import { Typography, Box, Stack, alpha, useTheme, Accordion, AccordionSummary, AccordionDetails, useMediaQuery, Paper, Avatar } from '@mui/material';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface MetadataCardProps {
  learningObjectives: string[];
  coreConcepts: string[];
  keywords: string[];
}

const InfoPod: React.FC<{ title: string; items: string[]; Icon: React.ElementType; color: string }> = ({ title, items, Icon, color }) => {
    return (
        <Paper elevation={0} sx={{ 
            p: 3, 
            height: '100%',
            bgcolor: alpha(color, 0.05), 
            border: `1px solid ${alpha(color, 0.1)}`,
            borderRadius: 3
        }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: color, width: 32, height: 32 }}>
                    <Icon sx={{ fontSize: 18, color: 'white' }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: 'text.primary', fontSize: '1rem' }}>
                    {title}
                </Typography>
            </Stack>
            <Stack spacing={1}>
                {items.map(item => (
                    <Typography key={item} variant="body2" color="text.secondary" display="flex" alignItems="start">
                        <Box component="span" sx={{ color: color, mr: 1, mt: '2px' }}>•</Box> {item}
                    </Typography>
                ))}
            </Stack>
        </Paper>
    );
};

export const MetadataCard: React.FC<MetadataCardProps> = ({ learningObjectives, coreConcepts, keywords }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const content = (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box flex={1}>
            <InfoPod title="Learning Objectives" items={learningObjectives} Icon={TrackChangesIcon} color={theme.palette.primary.main} />
        </Box>
        <Box flex={1}>
            <InfoPod title="Key Concepts" items={coreConcepts} Icon={LightbulbOutlinedIcon} color={theme.palette.secondary.main} />
        </Box>
        <Box flex={1}>
            <InfoPod title="Vocabulary" items={keywords} Icon={KeyboardIcon} color={theme.palette.success.main} />
        </Box>
    </Stack>
  );

  if (isMobile) {
    return (
      <Accordion elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, mb: 3, borderRadius: `${theme.shape.borderRadius}px !important` }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon color="primary" />} sx={{ px: 3 }}>
          <Typography variant="subtitle1" color="text.primary">Lesson Overview & Objectives</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pb: 3 }}>{content}</AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Box sx={{ my: 4 }}>
      {content}
    </Box>
  );
};