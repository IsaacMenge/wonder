export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

const ExplorePageClient = dynamicImport(() => import('@/components/explore/ExplorePageClient'));

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorePageClient />
    </Suspense>
  );
}
