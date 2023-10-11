import SidebarHeader from '../molecules/sidebar_header';
import SidebarLink from '../molecules/sidebar_link';
import SidebarTitle from '../molecules/sidebar_title';

export default function MainSidebar() {
  return (
    <div className='h-screen fixed flex flex-col top-0 left-0 w-72 bg-slate-700 text-slate-200'>
      <SidebarHeader />
      <SidebarLink path='/' icon_type='home' text='Dashboard' />
      <SidebarTitle
        title='Systems Backlog'
        subtitle='Amount spent and remaining playtime stats'
        path='/backlog'
      />
      <SidebarLink
        path='/backlog/nintendo-switch'
        icon_type='nintendo-switch'
        text='Nintendo Switch'
      />
      <SidebarLink path='/backlog/ps3' icon_type='ps3' text='PlayStation 3' />
      <SidebarTitle
        title='Franchises Checklists'
        subtitle='Completion percentages and achivements'
        path='/franchises'
      />
    </div>
  );
}
