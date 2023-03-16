import { BsNintendoSwitch } from 'react-icons/bs';

export default function LargeButton({ label }: { label: string }) {
  return (
    <button className='rounded-md border-b-4 border-r-4 border-emerald-400 max-w-2xl flex flex-col place-items-center text-center text-2xl text-emerald-900 select-none font-semibold p-6 mx-auto active:bg-emerald-400 active:border-none transition-all bg-emerald-300'>
      <BsNintendoSwitch className='mr-3 text-5xl' />{' '}
      <span className='mt-4'>{label}</span>
    </button>
  );
}
