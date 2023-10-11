export default function BacklogSystemSelector({
  params,
}: {
  params: { slug: string };
}) {
  return <div>{params.slug} Choose a System</div>;
}
