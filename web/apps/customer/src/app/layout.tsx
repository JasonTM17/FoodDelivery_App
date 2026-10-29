import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AuthProvider } from '@/lib/auth-provider';
import { CartProvider } from '@/lib/cart-store';
import { LanguageProvider } from '@/lib/language-context';

export const metadata: Metadata = {
  title: { template: '%s | FoodFlow', default: 'FoodFlow — Đặt đồ ăn giao nhanh' },
  description: 'Đặt món ăn từ các nhà hàng uy tín gần bạn, giao tận nơi nóng hổi.',
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
    <html lang="vi">
      <body className="font-sans">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
