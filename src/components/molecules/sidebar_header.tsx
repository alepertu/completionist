import { BsCheck2Circle } from 'react-icons/bs';

export default function SidebarHeader() {
  return (
    <div className='w-full p-6 flex font-extrabold text-xl items-center bg-slate-900 h-16'>
      <BsCheck2Circle className='mr-3' />
      Completion.ist
    </div>
  );
}
