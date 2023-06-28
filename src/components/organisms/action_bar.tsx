'use client';
import { usePathname } from 'next/navigation';

export default function ActionBar() {
  return (
    <div className='fixed flex items-center text-xs text-slate-900 font-semibold uppercase ps-7 top-0 z-20 w-full h-16 ml-72 bg-slate-300'>
      {'>'} Dashboard
      {usePathname().replaceAll('/', ' > ').replaceAll('-', ' ')}
    </div>
  );
}
