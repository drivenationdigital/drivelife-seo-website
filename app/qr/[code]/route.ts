import { NextResponse, type NextRequest } from "next/server";
import { getLinkedEntity } from "@/lib/api";

type RouteContext = {
  params: Promise<{ code: string }>;
};

/**
 * GET /qr/{code}
 *
 * Looks up the QR code on the WordPress side and 302s to either
 * `/user/{id}` (linked) or `/` (not linked).
 *
 * Redirect destination uses the **request's own origin** by default — so
 * staging redirects stay on staging, production on production, and a
 * missing/misconfigured NEXT_PUBLIC_SITE_URL can't cause a redirect loop.
 *
 * The ONE case where we cross origins is when the request arrived via the
 * `qr.` subdomain (rewritten internally by middleware). There we redirect
 * to NEXT_PUBLIC_SITE_URL so the user ends up on the canonical host, not
 * stuck on `qr.mydrivelife.com/user/{id}`.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { code } = await params;

  // Decide which origin to redirect against.
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const fromQrSubdomain = host.startsWith("qr.");
  const canonicalUrl = "https://app.mydrivelife.com";
  const baseUrl =
    fromQrSubdomain && canonicalUrl
      ? canonicalUrl
      : new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const linked = await getLinkedEntity(code);

  if (linked?.linked_to) {
    return NextResponse.redirect(new URL(`/profile/${linked.linked_to}`, baseUrl));
  }

  // Not linked (or lookup failed) — drop them on the landing page so
  // they can install the app and re-scan with the camera.
  return NextResponse.redirect(new URL("/", baseUrl));
}
