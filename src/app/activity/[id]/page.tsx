import ActivityDetail from '@/components/explore/ActivityDetail';




// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function Page(props: any) {
  const { params } = props as { params: { id: string } };
  return <ActivityDetail activityId={params.id} />;
}
