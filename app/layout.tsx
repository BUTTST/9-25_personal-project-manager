import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

export const metadata: Metadata = {
  title: '專案展示平台',
  description: '個人專案管理和展示平台',
  keywords: '專案管理, 展示平台, 個人作品集',
  authors: [{ name: 'Project Showcase Platform' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/project-showcase-platform-icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/project-showcase-platform-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/project-showcase-platform-icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/project-showcase-platform-icon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/project-showcase-platform-icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/project-showcase-platform-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/project-showcase-platform-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: '專案展示平台',
    description: '個人專案管理和展示平台',
    type: 'website',
    locale: 'zh_TW',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen bg-surface text-foreground transition-colors">
                <main className="relative">
                  {children}
                </main>
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
