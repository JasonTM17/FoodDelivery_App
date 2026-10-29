import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AuthProvider } from '@/lib/auth-provider';
import { CartProvider } from '@/lib/cart-store';

export const metadata: Metadata = {
  title: { template: '%s | FoodFlow', default: 'FoodFlow — Food delivery' },
  description: 'Order food from restaurants near you.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/foodflow-mark.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
