import Link from 'next/link';
import { getSortedPagesData } from '@/lib/content';

export default function ModuleNav({ moduleId, activeSlug }) {
  const pages = getSortedPagesData(moduleId);

  return (
    <nav style={{ padding: '1rem', borderRight: '1px solid #ccc', minWidth: '250px' }}>
      <h2>Module Pages</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pages.map(({ slug, title }) => {
          const isActive = slug === activeSlug;
          return (
            <li key={slug} style={{ margin: '0.5rem 0' }}>
              <Link href={`/modules/${moduleId}/${slug}`} style={{ 
                  textDecoration: 'none', 
                  color: isActive ? 'blue' : 'black',
                  fontWeight: isActive ? 'bold' : 'normal' 
                }}>
                  {title || slug.replace(/-/g, ' ')}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
