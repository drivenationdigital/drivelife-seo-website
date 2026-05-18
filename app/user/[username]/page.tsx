import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Facebook,
  Instagram,
  Youtube,
  Link2,
  Play,
} from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { OpenInAppCTA } from "@/components/OpenInAppCTA";
import {
  getUserProfile,
  getUserPosts,
  extractImageUrl,
  asNumber,
  formatCount,
  type ApiUser,
} from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const buildDeepLink = (handle: string | number) =>
  `drivelife://user/${encodeURIComponent(String(handle))}`;

type SocialPlatform = "instagram" | "facebook" | "tiktok" | "youtube";

/**
 * profile_links values come back as bare handles (e.g. "drivelife"), not URLs.
 * Without prefixing the platform domain, the browser treats the href as
 * relative and tries to open it inside this Next.js app. Build the real URL.
 *
 * Accepts a full URL as-is (in case the API ever returns one) and strips a
 * leading "@" since users sometimes include it.
 */
function buildSocialUrl(platform: SocialPlatform, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "");
  switch (platform) {
    case "instagram":
      return `https://www.instagram.com/${handle}`;
    case "facebook":
      return `https://www.facebook.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "youtube":
      return `https://www.youtube.com/@${handle}`;
  }
}

type Props = {
  params: Promise<{ username: string }>;
};

type SocialCard = {
  label: string;
  icon: ReactNode;
  href: string;
  external: boolean;
};

// lucide doesn't ship a TikTok icon — single-path SVG inline.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
    </svg>
  );
}

function buildDisplayName(user: ApiUser): string {
  const full = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || user.username;
}

// ---------- SEO ----------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserProfile(username);
  if (!user) return { title: "User not found" };

  const url = `${SITE_URL}/user/${user.username}`;
  const displayName = buildDisplayName(user);
  const followers = user.followers?.length ?? 0;
  const posts = asNumber(user.posts_count, 0);
  const description = `@${user.username} on DriveLife · ${formatCount(followers)} followers · ${formatCount(posts)} posts`;

  const cover = extractImageUrl(user.cover_image);
  const avatar = extractImageUrl(user.profile_image);
  const ogImage = cover || avatar;

  return {
    title: `${displayName} (@${user.username})`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title: `${displayName} (@${user.username})`,
      description,
      siteName: "DriveLife",
      images: ogImage ? [{ url: ogImage, alt: displayName }] : [],
      username: user.username,
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} (@${user.username})`,
      description,
      images: ogImage ? [ogImage] : [],
    },
    other: {
      "al:ios:url": buildDeepLink(user.username),
      "al:ios:app_store_id": "XXXXXXXXX",
      "al:ios:app_name": "DriveLife",
      "al:android:url": buildDeepLink(user.username),
      "al:android:package": "com.drivelife.app",
      "al:android:app_name": "DriveLife",
      "al:web:url": url,
    },
  };
}

// ---------- Page ----------

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await getUserProfile(username);
  if (!user) notFound();

  // Profile must resolve first to get the numeric id for the posts endpoint.
  // Posts capped at 3 (matches the grid below).
  const posts = await getUserPosts(user.id, 3);

  const deepLink = buildDeepLink(user.username);
  const cover = extractImageUrl(user.cover_image);
  const avatar = extractImageUrl(user.profile_image);
  const displayName = buildDisplayName(user);
  const followersCount = user.followers?.length ?? 0;
  const postsCount = asNumber(user.posts_count, 0);

  const links = user.profile_links ?? {};
  const externalLinks = Array.isArray(links.external_links)
    ? links.external_links
    : [];

  const socials: SocialCard[] = [];
  if (links.instagram)
    socials.push({
      label: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
      href: buildSocialUrl("instagram", links.instagram),
      external: true,
    });
  if (links.facebook)
    socials.push({
      label: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      href: buildSocialUrl("facebook", links.facebook),
      external: true,
    });
  if (links.tiktok)
    socials.push({
      label: "TikTok",
      icon: <TikTokIcon className="h-5 w-5" />,
      href: buildSocialUrl("tiktok", links.tiktok),
      external: true,
    });
  if (links.youtube)
    socials.push({
      label: "YouTube",
      icon: <Youtube className="h-5 w-5" />,
      href: buildSocialUrl("youtube", links.youtube),
      external: true,
    });
  if (externalLinks.length > 0)
    socials.push({
      label: "More",
      icon: <Link2 className="h-5 w-5" />,
      href: deepLink,
      external: false,
    });

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-12">
        {/* Cover + overlapping round avatar */}
        <header className="relative">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
            {cover ? (
              <Image
                src={cover}
                alt=""
                fill
                priority
                sizes="(min-width: 640px) 600px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
            )}
            {/* Bottom fade — softens the hard edge into the white page background */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-white"
            />
          </div>

          {/* Avatar */}
          <div className="-mt-14 flex justify-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-neutral-900 ring-[3px] ring-white shadow-sm">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={displayName}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Stats row */}
        <section className="mt-4 grid grid-cols-3 px-4">
          <div className="flex flex-col items-center px-1 text-center">
            <p className="flex max-w-full items-center gap-1 font-semibold text-neutral-900">
              <span className="truncate">{displayName}</span>
              {user.verified && (
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-gold-500"
                  aria-label="Verified"
                />
              )}
            </p>
            <p className="truncate text-sm text-neutral-500">
              @{user.username}
            </p>
          </div>
          <div className="flex flex-col items-center border-l border-neutral-200 px-1 text-center">
            <p className="text-xl font-bold text-neutral-900">
              {formatCount(followersCount)}
            </p>
            <p className="text-sm text-neutral-500">Followers</p>
          </div>
          <div className="flex flex-col items-center border-l border-neutral-200 px-1 text-center">
            <p className="text-xl font-bold text-neutral-900">
              {formatCount(postsCount)}
            </p>
            <p className="text-sm text-neutral-500">Posts</p>
          </div>
        </section>

        {/* Follow button */}
        <div className="mt-5 px-4">
          <a
            href={deepLink}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gold-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gold-500"
          >
            Follow
          </a>
        </div>

        {/* Social cards row */}
        {socials.length > 0 && (
          <div className="mt-3 px-4">
            <div className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  {...(s.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex min-w-[64px] flex-1 flex-col items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-3 text-white transition hover:bg-neutral-800"
                >
                  {s.icon}
                  <span className="text-[11px] font-medium">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Recent posts grid (3 max) */}
        {posts.length > 0 && (
          <section className="mt-6">
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => {
                const firstMedia = post.media[0];
                const isVideo = firstMedia?.media_type === "video";
                return (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="relative aspect-square overflow-hidden bg-neutral-100"
                  >
                    {firstMedia?.media_url && (
                      <Image
                        src={firstMedia.media_url}
                        alt={post.caption || ""}
                        fill
                        sizes="(min-width: 640px) 200px, 33vw"
                        className="object-cover"
                      />
                    )}
                    {isVideo && (
                      <span className="absolute right-1.5 top-1.5 rounded-sm bg-black/55 p-0.5 backdrop-blur-sm">
                        <Play
                          className="h-3 w-3 fill-white text-white"
                          aria-label="Video"
                        />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Open-in-app CTA */}
        <div className="mt-10 px-4">
          <OpenInAppCTA
            openInAppHref={deepLink}
            headline="See more in the app"
            subline={`Follow @${user.username}, see all ${formatCount(postsCount)} posts, garage and more in DriveLife.`}
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
