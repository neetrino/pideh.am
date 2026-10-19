import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Montserrat } from 'next/font/google';
import localFont from 'next/font/local';

import './globals.css';

/** Figma display face — Pricehigh Black (fonter.am, free for commercial use). */
const pricehigh = localFont({
  src: '../fonts/Pricehigh-Black.ttf',
  variable: '--font-pricehigh',
  weight: '900',
  style: 'normal',
  display: 'swap',
});

/**
 * Figma “Montserrat arm” (Vahan Hovhannisyan) — SIL OFL.
 * Package ships Regular + Bold; Bold is reused for 900 Black labels.
 * @see https://greghub.github.io/montserrat-arm/
 */
const montserratArm = localFont({
  src: [
    {
      path: '../fonts/MontserratArm-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/MontserratArm-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/MontserratArm-Bold.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-montserrat-arm',
  display: 'swap',
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

/**
 * Armenian UI face, weights 400–900. SIL OFL.
 * Vendored so production builds do not download this family from Google Fonts.
 * @see https://fonts.google.com/noto/specimen/Noto+Sans+Armenian
 */
const notoArmenian = localFont({
  src: '../fonts/NotoSansArmenian.woff2',
  variable: '--font-noto-armenian',
  weight: '400 900',
  style: 'normal',
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: 'Pideh',
    template: '%s · Pideh',
  },
  description: 'Հայկական փիդե — պատվիրիր առցանց',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy" className="h-full" suppressHydrationWarning>
      <body
        className={`${pricehigh.variable} ${montserratArm.variable} ${montserrat.variable} ${notoArmenian.variable} ${geistMono.variable} flex min-h-dvh flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
