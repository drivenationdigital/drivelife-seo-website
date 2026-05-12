import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  BadgeCheck,
  MapPin,
  Images,
  Play,
} from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { OpenInAppCTA } from "@/components/OpenInAppCTA";
import { getPostById, parseServerDate, formatCount, asNumber } from "@/lib/api";

// ----- Config -----
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const buildDeepLink = (id: string) => `drivelife://post/${id}`;

type Props = {
  params: Promise<{ id: string }>;
};

// ---------- SEO + share-card metadata ----------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) {
    return { title: "Post not found" };
  }

  const firstMedia = post.media?.[0];
  const caption = post.caption?.trim();
  const url = `${SITE_URL}/post/${post.id}`;

  // Fall back gracefully when there's no caption.
  const title = `Post by @${post.username}`;
  const description =
    caption ||
    `A ${firstMedia?.media_type ?? "post"} by @${post.username} on DriveLife.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "DriveLife",
      publishedTime: parseServerDate(post.post_date).toISOString(),
      authors: [post.username],
      images: firstMedia
        ? [
            {
              url: firstMedia.media_url,
              width: asNumber(firstMedia.media_width, 1200),
              height: asNumber(firstMedia.media_height, 1200),
              alt: firstMedia.media_alt || `Post by @${post.username}`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: firstMedia ? [firstMedia.media_url] : [],
    },
    // App-link metadata — lets iMessage/FB/etc. offer "Open in DriveLife".
    other: {
      "al:ios:url": buildDeepLink(post.id),
      "al:ios:app_store_id": "XXXXXXXXX",
      "al:ios:app_name": "DriveLife",
      "al:android:url": buildDeepLink(post.id),
      "al:android:package": "com.drivelife.app",
      "al:android:app_name": "DriveLife",
      "al:web:url": url,
    },
  };
}

// ---------- Page ----------

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const firstMedia = post.media?.[0];
  const moreMediaCount = Math.max(0, (post.media?.length ?? 0) - 1);
  const publishedDate = parseServerDate(post.post_date);
  const deepLink = buildDeepLink(post.id);
  const caption = post.caption?.trim();
  const location = post.location?.trim();
  const isVideo = firstMedia?.media_type === "video";

  // Image aspect ratio — fall back to portrait if missing.
  const w = asNumber(firstMedia?.media_width, 4);
  const h = asNumber(firstMedia?.media_height, 5);
  const aspectRatio = w && h ? `${w} / ${h}` : "4 / 5";

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-24 sm:pb-12">
        <article>
          {/* Author bar */}
          <header className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200">
                {post.user_profile_image ? (
                  <Image
                    src={post.user_profile_image}
                    alt={post.username}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-500">
                    {post.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="flex items-center gap-1 truncate text-sm font-semibold text-neutral-900">
                  <span className="truncate">{post.username}</span>
                  {post.user_verified && (
                    <BadgeCheck
                      className="h-3.5 w-3.5 shrink-0 text-gold-500"
                      aria-label="Verified"
                    />
                  )}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  <time dateTime={publishedDate.toISOString()}>
                    {formatDistanceToNow(publishedDate, { addSuffix: false })}{" "}
                    ago
                  </time>
                  {location && (
                    <>
                      <span className="mx-1">·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {location}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="More options"
              className="rounded-full p-1.5 text-neutral-700 transition hover:bg-neutral-100"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </header>

          {/* Media */}
          {firstMedia ? (
            <figure
              className="relative w-full overflow-hidden bg-neutral-100"
              style={{ aspectRatio }}
            >
              <Image
                src={firstMedia.media_url}
                alt={firstMedia.media_alt || `Post by @${post.username}`}
                fill
                priority
                sizes="(min-width: 640px) 600px, 100vw"
                className="object-cover"
                placeholder={firstMedia.blurred_url ? "blur" : "empty"}
                blurDataURL={firstMedia.blurred_url || undefined}
              />

              {/* Video indicator */}
              {isVideo && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/55 p-4 backdrop-blur-sm">
                    <Play className="h-7 w-7 fill-white text-white" />
                  </div>
                </div>
              )}

              {/* Multi-media badge — top right, like Instagram's stack icon */}
              {moreMediaCount > 0 && (
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <Images className="h-3.5 w-3.5" />
                  {post.media.length}
                </div>
              )}
            </figure>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-neutral-100 text-sm text-neutral-400">
              No media
            </div>
          )}

          {/* Engagement bar */}
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-3 text-neutral-900">
              <button
                type="button"
                aria-label="Like"
                className="transition hover:text-heart"
              >
                <Heart
                  className={
                    post.is_liked ? "h-6 w-6 fill-heart text-heart" : "h-6 w-6"
                  }
                  strokeWidth={1.75}
                />
              </button>
              <button
                type="button"
                aria-label="Comment"
                className="transition hover:opacity-60"
              >
                <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                aria-label="Share"
                className="transition hover:opacity-60"
              >
                <Send className="h-6 w-6" strokeWidth={1.75} />
              </button>
            </div>
            <button
              type="button"
              aria-label="Save"
              className="transition hover:opacity-60"
            >
              <Bookmark className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>

          {/* Like count */}
          {post.likes_count > 0 && (
            <p className="px-4 pt-2 text-sm font-semibold text-neutral-900">
              {formatCount(post.likes_count)}{" "}
              {post.likes_count === 1 ? "like" : "likes"}
            </p>
          )}

          {/* Caption (username inline, then text) — only if caption is non-empty */}
          {caption && (
            <div className="px-4 pt-1">
              <p className="text-sm leading-relaxed text-neutral-900">
                <span className="font-semibold">{post.username}</span>{" "}
                <span className="whitespace-pre-line text-neutral-800">
                  {caption}
                </span>
              </p>
            </div>
          )}

          {/* View comments link */}
          {post.comments_count > 0 && (
            <a
              href={deepLink}
              className="mt-1 block px-4 text-sm text-neutral-500 hover:text-neutral-700"
            >
              View all {formatCount(post.comments_count)}{" "}
              {post.comments_count === 1 ? "comment" : "comments"}
            </a>
          )}

          {/* Open-in-app card */}
          <div className="mt-6 px-4">
            <OpenInAppCTA
              openInAppHref={deepLink}
              subline={`Like, comment, and follow @${post.username} in DriveLife.`}
            />
          </div>

          {/* Footer */}
          <footer className="mt-12 px-4 text-center">
            <p className="text-xs text-neutral-400">
              © {new Date().getFullYear()} DriveLife
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}
