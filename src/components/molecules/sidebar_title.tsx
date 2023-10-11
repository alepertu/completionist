import Link from 'next/link';

export default function SidebarTitle({
  title,
  subtitle,
  path,
}: {
  title: string;
  subtitle?: string | undefined;
  path: string;
}) {
  return (
    <div className='ps-4 my-4 flex flex-col font-semibold text-sm text-purple-600'>
      <Link href={path}>{title.toUpperCase()}</Link>
      <span className='font-normal text-xs text-slate-500'>{subtitle}</span>
    </div>
  );
}
