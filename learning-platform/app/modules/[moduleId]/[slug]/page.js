import { getAllModuleIds, getPageData, getModulePages, getModuleStructure } from '@/lib/content';
import ModulePageClient from '@/app/components/ModulePageClient';

export async function generateStaticParams() {
  const moduleIds = await getAllModuleIds();
  const paths = [];

  for (const { params } of moduleIds) {
    const { moduleId } = params;
    const pages = await getModulePages(moduleId);
    for (const page of pages) {
      paths.push({
        moduleId: moduleId,
        slug: page.slug,
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
  const navData = await getModuleStructure(moduleId);

  return <ModulePageClient moduleId={moduleId} slug={slug} navData={navData} pageData={pageData} />;
}
