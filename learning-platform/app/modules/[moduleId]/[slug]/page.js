import { getAllModuleIds, getPageData, getSortedPagesData } from '../../../lib/content';

export async function generateStaticParams() {
    const moduleIds = getAllModuleIds();
    const allPaths = [];

    for (const moduleIdObj of moduleIds) {
        const moduleId = moduleIdObj.params.moduleId;
        const pagesData = getSortedPagesData(moduleId);
        pagesData.forEach((page) => {
            allPaths.push({
                moduleId: moduleId,
                slug: page.slug,
            });
        });
    }

    return allPaths;
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