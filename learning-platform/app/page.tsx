import Link from 'next/link';
import { getAllModuleIds, getSortedPagesData } from '@/lib/content';
import { Container, Grid, Card, CardContent, CardActions, Button, Typography, Box } from '@mui/material';

export default async function Home() {
  const moduleIds = await getAllModuleIds();

  const moduleLinks = await Promise.all(
    moduleIds.map(async ({ params }) => {
      const { moduleId } = params;
      const pages = await getSortedPagesData(moduleId);
      const firstPageSlug = pages.length > 0 ? pages[0].slug : '';
      
      return {
        id: moduleId,
        href: `/modules/${moduleId}/${firstPageSlug}`,
        title: `Venture Capital Term Sheet`, 
        description: `An interactive case study on negotiating a venture capital term sheet.`
      };
    })
  );

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
