'use client';

import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import type { Keyword, PageMetadata } from '@/lib/content';

type MetadataCardProps = {
  metadata: PageMetadata;
};

export default function MetadataCard({ metadata }: MetadataCardProps) {
  const { learningObjectives, coreConcepts, keywords, description } = metadata;

  return (
    <Card component="section" sx={{ mb: 3 }}>
      <CardHeader
        title="Learning Overview"
        subheader={description}
        titleTypographyProps={{ variant: 'h3', component: 'h2' }}
      />
      <CardContent>
        <Stack spacing={3}>
          {learningObjectives.length > 0 && (
            <MetadataList title="Learning Objectives" items={learningObjectives} />
          )}
          {coreConcepts.length > 0 && <MetadataList title="Core Concepts" items={coreConcepts} />}
          {keywords.length > 0 && <KeywordList keywords={keywords} />}
        </Stack>
      </CardContent>
    </Card>
  );
}

type MetadataListProps = {
  title: string;
  items: string[];
};

function MetadataList({ title, items }: MetadataListProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Stack component="ul" spacing={1} sx={{ listStyle: 'disc', pl: 3, m: 0 }}>
        {items.map((item, index) => (
          <Typography key={index} component="li" variant="body1" sx={{ lineHeight: 1.6 }}>
            {item}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}

type KeywordListProps = {
  keywords: Keyword[];
};

function KeywordList({ keywords }: KeywordListProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
        Key Terms
      </Typography>
      <Stack spacing={1.5}>
        {keywords.map((keyword) => (
          <Stack
            key={keyword.term}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Chip
              label={keyword.term}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
            />
            {keyword.definition && (
              <Typography variant="body2" color="text.secondary">
                {keyword.definition}
              </Typography>
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
