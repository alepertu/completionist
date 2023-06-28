import { BsHouse, BsNintendoSwitch, BsPlaystation } from 'react-icons/bs';

export default function SidebarIcon({ type }: { type: string }) {
  const icons_classname = 'mr-2';
  return type === 'nintendo-switch' ? (
    <BsNintendoSwitch className={icons_classname} />
  ) : type === 'home' ? (
    <BsHouse className={icons_classname} />
  ) : type === 'ps3' ? (
    <BsPlaystation className={icons_classname} />
  ) : (
    <></>
  );
}
