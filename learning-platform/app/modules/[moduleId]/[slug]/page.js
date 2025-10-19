import { getAllModuleIds, getPageData, getSortedPagesData } from '@/lib/content';
import ModuleNav from '@/app/components/ModuleNav';

export async function generateStaticParams() {
  const moduleIds = getAllModuleIds();
  const paths = [];

  for (const { params } of moduleIds) {
    const { moduleId } = params;
    const pagesData = getSortedPagesData(moduleId);
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

  return (
    <div style={{ display: 'flex' }}>
      <ModuleNav moduleId={moduleId} activeSlug={slug} />
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        <article>
          <h1>{pageData.title}</h1>
          <div>
            <div dangerouslySetInnerHTML={{ __html: pageData.contentHtml }} />
          </div>
        </article>
      </main>
    </div>
  );
}
