import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Google Maps JS loads from maps.googleapis.com / maps.gstatic.com; Tidio chat from *.tidio.co
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://*.tidio.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tidio.co",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com https://*.tidio.co",
      "connect-src 'self' https: wss://*.tidio.co",
      "media-src 'self' https://*.tidio.co",
      "worker-src 'self' blob:",
      "frame-src 'self' https://www.google.com https://maps.google.com https://maps.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

function buildImageRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  // `remotePatterns` is evaluated at build time. Always allow R2 public hosts so
  // Vercel builds work even when R2_PUBLIC_BASE_URL is only set at runtime.
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    {
      protocol: 'https',
      hostname: 'images.pexels.com',
    },
    {
      protocol: 'https',
      hostname: '**.r2.dev',
      pathname: '/**',
    },
  ];

  const r2Base = process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL;
  if (r2Base) {
    try {
      const url = new URL(r2Base);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        patterns.push({
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
          hostname: url.hostname,
          pathname: '/**',
        });
      }
    } catch {
      // Invalid R2 public base — wildcard *.r2.dev still covers default public URLs.
    }
  }

  return patterns;
}

const r2PublicBase = (process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL || '').replace(
  /\/$/,
  '',
);

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  env: {
    NEXT_PUBLIC_R2_PUBLIC_BASE_URL: r2PublicBase,
  },
  // Product/category/hero drawers upload images via Server Actions (up to 5MB each).
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  images: {
    remotePatterns: buildImageRemotePatterns(),
    qualities: [75, 90, 100],
  },
  async headers() {
    const heroMediaCache = {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    };

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/brand/pideh/hero-food.mp4',
        headers: [heroMediaCache],
      },
      {
        source: '/brand/pideh/hero-food-poster.jpg',
        headers: [heroMediaCache],
      },
    ];
  },
};

export default nextConfig;
