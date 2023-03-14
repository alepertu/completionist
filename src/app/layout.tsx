import '../styles/globals.css';

export const metadata = {
  title: 'Template page',
  description: 'Base template page for customization',
}; // !FIXME

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='es'>
      <body>{children}</body>
    </html>
  ); // !FIXME
}
