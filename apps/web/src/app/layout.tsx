import { AuthProvider } from '../components/auth-provider';
import { AppShell } from '../components/layout';

export const metadata = {
  title: 'Group Watch MVP',
  description: 'Monitor watched groups and review scraped posts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
