import { getAllModuleIds, getPageData, getSortedPagesData } from '@/lib/content';
import ModuleNav from '@/app/components/ModuleNav';
import { Box, Container, Paper, Typography, Card, CardContent, CardHeader } from '@mui/material';

export async function generateStaticParams() {
  const moduleIds = await getAllModuleIds();
  const paths = [];

  for (const { params } of moduleIds) {
    const { moduleId } = params;
    const pagesData = await getSortedPagesData(moduleId);
    for (const pageData of pagesData) {
      paths.push({
        moduleId: moduleId,
        slug: pageData.slug,
      });
    }
  }

  return paths;
}

async function getPageContent(moduleId, slug) {
  const pageData = await getPageData(moduleId, slug);
  return pageData;
}

export default async function Page({ params }) {
  const { moduleId, slug } = params;
  const pageData = await getPageContent(moduleId, slug);
  const navData = await getSortedPagesData(moduleId); // Fetch navigation data here

  return (
    <Box sx={{ display: 'flex' }}>
      <ModuleNav moduleId={moduleId} activeSlug={slug} pages={navData} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 4,
          px: 3,
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="lg">
          {pageData.contentChunks.map((chunk, index) => (
            <Card key={index} component="article" sx={{ mb: 3 }}>
              <CardHeader title={chunk.title} component="h2" />
              <CardContent>
                <div
                  className="prose lg:prose-xl"
                  dangerouslySetInnerHTML={{ __html: chunk.contentHtml }}
                />
              </CardContent>
            </Card>
          ))}

          {pageData.instructorNoteHtml && (
            <Card
              component="aside"
              sx={{
                mb: 3,
                border: 2,
                borderColor: 'secondary.main',
                bgcolor: 'secondary.light',
              }}
            >
              <CardHeader
                title="Instructor Notes"
                component="h3"
                sx={{ color: 'secondary.contrastText' }}
              />
              <CardContent>
                <div
                  className="prose lg:prose-xl"
                  dangerouslySetInnerHTML={{
                    __html: pageData.instructorNoteHtml,
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </Box>
  );
}