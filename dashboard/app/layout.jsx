import './globals.css';

export const metadata = {
  title: 'Account Aggregator Dashboard',
  description: 'Live Demo - Consent → Webhook → Data Fetch',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

