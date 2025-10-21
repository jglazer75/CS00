import { getAllModuleIds, getPageData, getSortedPagesData } from '@/lib/content';
import ModuleNav from '@/app/components/ModuleNav';
import ModulePageContent from '@/app/components/ModulePageContent';
import { Box } from '@mui/material';

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
      <ModulePageContent
        metadata={pageData.metadata}
        chunks={pageData.chunks}
        instructorNote={pageData.instructorNote}
        tableOfContents={pageData.tableOfContents}
      />
    </Box>
  );
}
