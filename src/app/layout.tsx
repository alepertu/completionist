import { Orbitron } from 'next/font/google';

import '../styles/globals.css';

const orbitron = Orbitron({ subsets: ['latin'] });

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
      <body className={orbitron.className + ' bg-yellow-50'}>{children}</body>
    </html>
  );
}
