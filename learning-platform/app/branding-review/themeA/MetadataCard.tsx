import React from 'react';
import { Card, CardContent, Grid, Typography, List, ListItem, ListItemText, ListItemIcon, alpha, Box, Accordion, AccordionSummary, AccordionDetails, useMediaQuery, useTheme } from '@mui/material';
import TargetIcon from '@mui/icons-material/Adjust';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TagIcon from '@mui/icons-material/Tag';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface MetadataCardProps {
  learningObjectives: string[];
  coreConcepts: string[];
  keywords: string[];
}

const MetadataList: React.FC<{ title: string; items: string[]; Icon: React.ElementType }> = ({ title, items, Icon }) => {
  const theme = useTheme();
  return (
    <>
      <Typography variant="subtitle2" display="flex" alignItems="center" gutterBottom sx={{ color: theme.palette.secondary.main, fontWeight: 700 }}>
        <Icon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} /> {title}
      </Typography>
      <List dense disablePadding>
        {items.map(item => (
          <ListItem key={item} disableGutters alignItems="start">
            <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
              <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: alpha(theme.palette.secondary.main, 0.5) }} />
            </ListItemIcon>
            <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        ))}
      </List>
    </>
  );
};

export const MetadataCard: React.FC<MetadataCardProps> = ({ learningObjectives, coreConcepts, keywords }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const content = (
    <Grid container spacing={4} sx={{ p: 1 }}>
      <Grid item xs={12} md={4}>
        <MetadataList title="Learning Objectives" items={learningObjectives} Icon={TargetIcon} />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetadataList title="Core Concepts" items={coreConcepts} Icon={PsychologyIcon} />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetadataList title="Keywords" items={keywords} Icon={TagIcon} />
      </Grid>
    </Grid>
  );

  if (isMobile) {
    return (
      <Accordion elevation={1} sx={{ my: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          <Typography variant="h6" color="primary.main">Key Lesson Info</Typography>
        </AccordionSummary>
        <AccordionDetails>{content}</AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1), my: 3 }}>
      <CardContent sx={{ p: 4 }}>{content}</CardContent>
    </Card>
  );
};