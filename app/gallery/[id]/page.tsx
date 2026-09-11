import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Images, User } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { OpenInAppCTA } from "@/components/OpenInAppCTA";
import {
  getGalleryById,
  countryFlag,
  type ApiGalleryTag,
  type ApiGalleryPhoto,
} from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const buildDeepLink = (id: string | number, photo?: number) =>
  photo ? `drivelife://gallery/${id}?photo=${photo}` : `drivelife://gallery/${id}`;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo?: string }>;
};

/** The owner's chosen cover, else the first photo — the same rule as the app. */
function pickCover(photos: ApiGalleryPhoto[]): ApiGalleryPhoto | undefined {
  return photos.find((p) => p.is_cover) ?? photos[0];
}

// ---------- SEO ----------

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

  // A link to one photo previews THAT photo. Sharing a specific image and
  // getting the gallery's cover back is the share silently losing what was
  // being pointed at.
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

// ---------- Pieces ----------

function TagChip({ tag }: { tag: ApiGalleryTag }) {
  const label = tag.type === "user" ? `@${tag.username}` : tag.name;

  return (
    <Link
      href={tag.href}
      className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 py-1 pl-1 pr-3 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-200"
    >
      <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-neutral-200">
        {tag.image ? (
          <Image src={tag.image} alt="" fill sizes="20px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <User className="h-3 w-3 text-neutral-500" />
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}

/** One square in the grid. Opens that photo on its own. */
function Tile({
  photo,
  galleryId,
  title,
}: {
  photo: ApiGalleryPhoto;
  galleryId: number;
  title: string;
}) {
  return (
    <Link
      href={`/gallery/${galleryId}?photo=${photo.id}`}
      className="relative block aspect-square overflow-hidden bg-neutral-100"
      aria-label={`View photo from ${title}`}
    >
      <Image
        src={photo.thumb}
        alt=""
        fill
        sizes="(min-width: 640px) 200px, 33vw"
        className="object-cover transition duration-200 hover:opacity-90"
      />

      {/* A tagged tile says so, the way the app badges them. */}
      {photo.tags.length > 0 && (
        <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
          <User className="h-2.5 w-2.5" />
          {photo.tags.length}
        </span>
      )}
    </Link>
  );
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

  // Single view when a photo was asked for, otherwise the gallery's own cover.
  // Either way one photo leads and the rest are tiles underneath — the same
  // shape as the app, so a link and the app agree about what this gallery is.
  const single = photoId ? photos.find((p) => p.id === photoId) : undefined;
  const lead = single ?? pickCover(photos);
  const rest = lead ? photos.filter((p) => p.id !== lead.id) : photos;

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-12">
        {/* Lead photo, full bleed like the app's cover */}
        {lead && (
          <figure className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
              <Image
                src={lead.url}
                alt={gallery.title}
                fill
                priority
                sizes="(min-width: 640px) 600px, 100vw"
                className="object-cover"
              />
            </div>

            {lead.tags.length > 0 && (
              <figcaption className="flex flex-wrap gap-1.5 px-4 pt-3">
                {lead.tags.map((tag) => (
                  <TagChip key={`${tag.type}-${tag.id}`} tag={tag} />
                ))}
              </figcaption>
            )}
          </figure>
        )}

        {/* Title block */}
        <header className="px-4 pt-4">
          {single && (
            <Link
              href={`/gallery/${gallery.id}`}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition hover:text-neutral-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All photos
            </Link>
          )}

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

        {/* Everything else, as tiles. Three across and a 2px gutter, which is
            what the app uses — the photos are the page, not the spacing. */}
        {rest.length > 0 && (
          <section className="mt-6">
            <div className="grid grid-cols-3 gap-0.5">
              {rest.map((p) => (
                <Tile
                  key={p.id}
                  photo={p}
                  galleryId={gallery.id}
                  title={gallery.title}
                />
              ))}
            </div>
          </section>
        )}

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
