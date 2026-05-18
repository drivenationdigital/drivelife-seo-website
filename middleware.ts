import { NextResponse, type NextRequest } from 'next/server';

const QR_SUBDOMAIN_PREFIX = 'qr.';

/**
 * Normalises the three legacy QR-code URL shapes into a single
 * `/qr/{code}` request that `app/qr/[code]/route.ts` resolves:
 *
 *   1. ?qr=CODE  on any page → 302 → /qr/CODE  (strip the param to avoid loops)
 *   2. qr.example.com/CODE  → internal rewrite → /qr/CODE
 *                              (the handler then 302s to the canonical host)
 *   3. /qr/CODE  → falls through to the route handler directly
 */
export function middleware(request: NextRequest) {
  const { nextUrl, headers } = request;
  const host = (headers.get('host') ?? '').toLowerCase();
  const url = nextUrl.clone();

  // (2) qr.* subdomain → rewrite the first path segment as the code.
  if (host.startsWith(QR_SUBDOMAIN_PREFIX) && !url.pathname.startsWith('/qr/')) {
    const code = url.pathname.replace(/^\/+/, '').split('/')[0];
    if (code) {
      url.pathname = `/qr/${code}`;
      url.search = '';
      return NextResponse.rewrite(url);
    }
  }

  // (1) any path carrying ?qr=CODE → redirect to /qr/CODE without the param.
  const qrParam = nextUrl.searchParams.get('qr');
  if (qrParam) {
    url.searchParams.delete('qr');
    url.pathname = `/qr/${encodeURIComponent(qrParam)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every request EXCEPT:
     *   - /api/*               (none yet, kept for future)
     *   - /_next/static, _next/image  (build output + image optimisation)
     *   - favicon + brand assets we ship from /public
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|drivelife-logo.*|og-image.png).*)',
  ],
};
