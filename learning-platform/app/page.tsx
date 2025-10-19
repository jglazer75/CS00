import Link from 'next/link';
import { getAllModuleIds, getSortedPagesData } from '../lib/content';

// This is a Server Component, so we can fetch data directly
export default function Home() {
  const moduleIds = getAllModuleIds();

  // We need to find the first page of each module to link to it
  const moduleLinks = moduleIds.map(({ params }) => {
    const { moduleId } = params;
    const pages = getSortedPagesData(moduleId);
    const firstPageSlug = pages.length > 0 ? pages[0].slug : '';
    
    return {
      id: moduleId,
      href: `/modules/${moduleId}/${firstPageSlug}`,
      title: `Module: ${moduleId}`, // You can make this title better in the future
    };
  });

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Available Modules</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {moduleLinks.map(({ id, href, title }) => (
          <li key={id} style={{ margin: '1rem 0' }}>
            <Link href={href}>
              <a style={{ fontSize: '1.25rem', textDecoration: 'none', color: 'blue' }}>
                {title}
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}