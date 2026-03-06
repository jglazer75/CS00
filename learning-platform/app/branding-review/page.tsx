import { notFound } from 'next/navigation';
import ThemeShowcase from './ThemeShowcase';

export default function BrandingReviewPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return <ThemeShowcase />;
}
