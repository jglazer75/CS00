'use client';

import Link from 'next/link';
import { Container, Card, CardContent, CardActions, Button, Typography, Box } from '@mui/material';

type ModuleLink = {
  id: string;
  href: string;
  title: string;
  description: string;
};

export default function DashboardClient({ moduleLinks }: { moduleLinks: ModuleLink[] }) {
  return (
    <Box component="main" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Available Modules
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4, // Spacing between items
          }}
        >
          {moduleLinks.map(({ id, href, title, description }) => (
            <Box
              key={id}
              sx={{
                width: {
                  xs: '100%', // Full width on extra-small screens
                  sm: 'calc(50% - 16px)', // Half width on small screens (minus gap)
                  md: 'calc(33.333% - 22px)', // One-third width on medium screens (minus gap)
                },
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {title}
                  </Typography>
                  <Typography>
                    {description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button component={Link} href={href} size="small" variant="contained">
                    Start Module
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
