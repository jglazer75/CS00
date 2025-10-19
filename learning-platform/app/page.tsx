import { getAllModuleIds, getSortedPagesData } from '@/lib/content';
import DashboardClient from './components/DashboardClient';

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

  return <DashboardClient moduleLinks={moduleLinks} />;
}