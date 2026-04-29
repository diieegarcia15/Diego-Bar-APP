import { PT_Sans_Narrow, Cinzel } from 'next/font/google';
import './globals.css';

const ptSansNarrow = PT_Sans_Narrow({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans-narrow',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-cinzel',
});

export const metadata = {
  title: 'Bar APP Diego - Menú Inteligente',
  description: 'Sistema de pedidos por código QR para restaurantes. Pedí desde tu mesa.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${ptSansNarrow.variable} ${cinzel.variable}`}>
      <body className="font-[family-name:var(--font-pt-sans-narrow)] min-h-screen bg-dark-900 text-white antialiased uppercase">
        {children}
      </body>
    </html>
  );
}
