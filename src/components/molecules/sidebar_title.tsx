export default function SidebarTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | undefined;
}) {
  return (
    <div className='ps-4 my-4 flex flex-col font-semibold text-sm text-purple-600'>
      {title.toUpperCase()}
      <span className='font-normal text-xs text-slate-500'>{subtitle}</span>
    </div>
  );
}
