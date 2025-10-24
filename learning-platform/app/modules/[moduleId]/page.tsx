import { notFound } from 'next/navigation';
import { getAllModuleIds, getSortedPagesData } from '@/lib/content';
import ModuleRedirectClient from '@/app/components/ModuleRedirectClient';

type ModuleParams = {
  params: {
    moduleId: string;
  };
};

export async function generateStaticParams() {
  const moduleIds = await getAllModuleIds();
  return moduleIds.map(({ params }) => params);
}

export default async function ModuleIndexPage({ params }: ModuleParams) {
  const { moduleId } = params;
  const pages = await getSortedPagesData(moduleId);

  if (!pages || pages.length === 0) {
    notFound();
  }

  const slugs = pages.map((page) => page.slug);

  return <ModuleRedirectClient moduleId={moduleId} slugs={slugs} />;
}
