import '../styles/globals.css';

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
      <body>{children}</body>
    </html>
  );
}
