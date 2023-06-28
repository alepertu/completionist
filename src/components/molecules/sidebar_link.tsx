'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import SidebarIcon from '../atoms/sidebar_icon';

export default function SidebarLink({
  path,
  icon_type,
  text,
}: {
  path: string;
  icon_type: string;
  text: string;
}) {
  return (
    <Link
      href={path}
      className={`p-4 cursor-pointer flex font-semibold items-center text-sm text-slate-100 ${
        path === usePathname() ? 'bg-slate-800' : ''
      } hover:bg-slate-800`}
    >
      <SidebarIcon type={icon_type} /> {text}
    </Link>
  );
}
