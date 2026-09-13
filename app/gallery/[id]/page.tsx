import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Images } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { OpenInAppCTA } from "@/components/OpenInAppCTA";
import { getGalleryById, countryFlag, type ApiGalleryPhoto } from "@/lib/api";

import { GalleryViewer } from "./GalleryViewer";
import { TagChip } from "./TagChip";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The query form, deliberately: the app reads these parameters before it
// looks at the path, so this works on builds whose path handling is older
// or broken. See dl-* in deeplinks_helper.dart.
const buildDeepLink = (id: string | number, photo?: number) =>
  photo
    ? `drivelife://app/?dl-gallery=${id}&photo=${photo}`
    : `drivelife://app/?dl-gallery=${id}`;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo?: string }>;
};

/** The owner's chosen cover, else the first photo — the same rule as the app. */
function pickCover(photos: ApiGalleryPhoto[]): ApiGalleryPhoto | undefined {
  return photos.find((p) => p.is_cover) ?? photos[0];
}

// ---------- SEO ----------
//
// Still decided on the server from ?photo=, so a link to one photo previews
// that photo in iMessage, WhatsApp and search. The client viewer changes the
// URL as you browse, but a crawler or a link preview only ever sees this.

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const { photo } = await searchParams;

  const data = await getGalleryById(id);
  if (!data) return { title: "Gallery not found" };

  const { gallery, photos } = data;
  const photoId = Number(photo) || 0;

  const target = photoId
    ? photos.find((p) => p.id === photoId) ?? pickCover(photos)
    : pickCover(photos);

  const owner = gallery.owner?.username;
  const url = photoId
    ? `${SITE_URL}/gallery/${gallery.id}?photo=${photoId}`
    : `${SITE_URL}/gallery/${gallery.id}`;

  const count = gallery.photo_count;
  const description = owner
    ? `${count} photo${count === 1 ? "" : "s"} by @${owner} on DriveLife.`
    : `${count} photo${count === 1 ? "" : "s"} on DriveLife.`;

  return {
    title: gallery.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: gallery.title,
      description,
      siteName: "DriveLife",
      images: target ? [{ url: target.url, alt: gallery.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: gallery.title,
      description,
      images: target ? [target.url] : [],
    },
    other: {
      "al:ios:url": buildDeepLink(gallery.id, photoId || undefined),
      "al:ios:app_store_id": "XXXXXXXXX",
      "al:ios:app_name": "DriveLife",
      "al:android:url": buildDeepLink(gallery.id, photoId || undefined),
      "al:android:package": "com.drivelife.app",
      "al:android:app_name": "DriveLife",
      "al:web:url": url,
    },
  };
}

// ---------- Page ----------

export default async function GalleryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { photo } = await searchParams;

  const data = await getGalleryById(id);
  if (!data) notFound();

  const { gallery, photos, tags } = data;
  const photoId = Number(photo) || 0;

  const deepLink = buildDeepLink(gallery.id, photoId || undefined);
  const owner = gallery.owner;
  const flag = countryFlag(gallery.country);

  // The photo asked for, else the cover. Rendered on the server either way,
  // so the first paint is the right photo before any JavaScript runs.
  const lead = (photoId && photos.find((p) => p.id === photoId)) || pickCover(photos);

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-12">
        <GalleryViewer
          galleryId={gallery.id}
          title={gallery.title}
          photos={photos}
          initialId={lead?.id ?? 0}
        >
          {/* Title block, between the lead photo and the grid */}
          <header className="px-4 pt-4">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {gallery.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <Images className="h-3.5 w-3.5 text-gold-500" />
                {gallery.photo_count} photo{gallery.photo_count === 1 ? "" : "s"}
              </span>
              {flag && (
                <span aria-label={gallery.country ?? undefined}>
                  {flag} {gallery.country}
                </span>
              )}
            </div>

            {owner?.username && (
              <Link
                href={`/profile/${owner.username}`}
                className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-neutral-100 px-3.5 py-2 transition hover:bg-neutral-200"
              >
                <span className="relative h-7 w-7 overflow-hidden rounded-full bg-neutral-200">
                  {owner.avatar ? (
                    <Image
                      src={owner.avatar}
                      alt=""
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                      {owner.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold text-neutral-900">
                  @{owner.username}
                </span>
              </Link>
            )}
          </header>

          {/* Tags that apply to the whole gallery */}
          {tags.length > 0 && (
            <section className="mt-5 px-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                In this gallery
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <TagChip key={`${tag.type}-${tag.id}`} tag={tag} />
                ))}
              </div>
            </section>
          )}
        </GalleryViewer>

        {photos.length === 0 && (
          <p className="mt-10 px-4 text-center text-sm text-neutral-500">
            This gallery has no photos yet.
          </p>
        )}

        {/* Open-in-app CTA */}
        <div className="mt-12 px-4">
          <OpenInAppCTA
            openInAppHref={deepLink}
            headline="Open in the app"
            subline="See every photo, who is tagged and what they drive in DriveLife."
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 px-4 text-center">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} DriveLife
          </p>
        </footer>
      </main>
    </>
  );
}
