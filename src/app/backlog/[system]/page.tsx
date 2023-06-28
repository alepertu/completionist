export default function BacklogDashboard({
  params,
}: {
  params: { slug: string };
}) {
  return <div>{params.slug} Hello?</div>;
}
