import { NextResponse, type NextRequest } from 'next/server';
import { getLinkedEntity } from '@/lib/api';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

type RouteContext = {
  params: Promise<{ code: string }>;
};

/**
 * GET /qr/{code}
 *
 * Looks up the QR code on the WordPress side and 302s to:
 *   - /user/{id} if the code is linked to a user (our user route accepts
 *     numeric ids via auto-detection)
 *   - the landing page otherwise (the app-download page is the natural
 *     fallback when a code isn't claimed yet)
 *
 * Redirects are absolute (against NEXT_PUBLIC_SITE_URL) so that requests
 * arriving via the `qr.` subdomain (rewritten by middleware) land on the
 * canonical host.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL('/', SITE_URL));
  }

  const linked = await getLinkedEntity(code);

  if (linked?.linked_to) {
    return NextResponse.redirect(
      new URL(`/user/${linked.linked_to}`, SITE_URL),
    );
  }

  // Not linked (or lookup failed) — drop them on the landing page so
  // they can install the app and re-scan with the camera.
  return NextResponse.redirect(new URL('/', SITE_URL));
}
