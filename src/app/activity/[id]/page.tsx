import { headers } from 'next/headers';
import ActivityDetail from '@/components/explore/ActivityDetail';

export default async function Page({ params }: { params: { id: string } }) {
  const headersList = headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const url = `${protocol}://${host}/api/activities/detail/${params.id}`;
  const res = await fetch(url, { cache: 'no-store' });
  const activity = await res.json();
  return <ActivityDetail activity={activity} />;
}
