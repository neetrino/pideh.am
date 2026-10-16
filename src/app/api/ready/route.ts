import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Lightweight readiness probe for Coolify.
 * External dependencies are intentionally excluded.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      service: 'pideh',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
