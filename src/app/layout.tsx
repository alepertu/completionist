import { Inter } from 'next/font/google';

import '../styles/globals.css';

import ActionBar from '@/components/organisms/action_bar';
import MainSidebar from '@/components/organisms/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Completionist',
  description: 'Tooling for game completionists',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <MainSidebar />
        <ActionBar />
        <div className='ml-72 mt-16'>{children}</div>
      </body>
    </html>
  );
}
