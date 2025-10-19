'use client';

import Link from 'next/link';
import { Container, Card, CardContent, CardActions, Button, Typography, Box } from '@mui/material';
import Grid from '@mui/material/Grid'; // Corrected import

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
        <Grid container spacing={4}>
          {moduleLinks.map(({ id, href, title, description }) => (
            <Grid item key={id} xs={12} sm={6} md={4}>
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
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
