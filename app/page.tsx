import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

import { SiteHeader } from '@/components/SiteHeader';
import { OpenInAppCTA } from '@/components/OpenInAppCTA';
import { MobileAppBar } from '@/components/MobileAppBar';
import { getMockPost, formatCount } from '@/lib/mock';

// ----- Config (move to env when wiring real deeplinks) -----
const SITE_URL = 'https://drivelife.com';
const APP_STORE_URL = 'https://apps.apple.com/app/idXXXXXXXXX';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.drivelife.app';
const buildDeepLink = (slug: string) => `drivelife://post/${slug}`;

type Props = {
  params: Promise<{ slug: string }>;
};

// ----- SEO + share-card metadata -----
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getMockPost(slug);
  if (!post) return {};

  const url = `${SITE_URL}/post/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.excerpt,
      siteName: 'DriveLife',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: post.coverImage.url,
          width: post.coverImage.width,
          height: post.coverImage.height,
          alt: post.coverImage.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage.url],
    },
    // App-link metadata so iMessage / FB / Twitter / etc. can "Open in App".
    other: {
      'al:ios:url': buildDeepLink(post.slug),
      'al:ios:app_store_id': 'XXXXXXXXX',
      'al:ios:app_name': 'DriveLife',
      'al:android:url': buildDeepLink(post.slug),
      'al:android:package': 'com.drivelife.app',
      'al:android:app_name': 'DriveLife',
      'al:web:url': url,
    },
  };
}

// ----- Page -----
export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getMockPost(slug);
  if (!post) notFound();

  const deepLink = buildDeepLink(post.slug);
  const publishedDate = new Date(post.publishedAt);
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: false });

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-24 sm:pb-12">
        <article>
          {/* Author bar */}
          <header className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200">
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {post.author.handle}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  <time dateTime={post.publishedAt}>{timeAgo} ago</time>
                  {post.location && (
                    <>
                      <span className="mx-1">·</span>
                      <span>{post.location}</span>
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

          {/* Photo */}
          <figure className="relative w-full bg-neutral-100">
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
              <Image
                src={post.coverImage.url}
                alt={post.coverImage.alt}
                fill
                priority
                sizes="(min-width: 640px) 600px, 100vw"
                className="object-cover"
              />
            </div>
          </figure>

          {/* Engagement bar */}
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-3 text-neutral-900">
              <button type="button" aria-label="Like" className="transition hover:text-heart">
                <Heart className="h-6 w-6" strokeWidth={1.75} />
              </button>
              <button type="button" aria-label="Comment" className="transition hover:opacity-60">
                <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
              </button>
              <button type="button" aria-label="Share" className="transition hover:opacity-60">
                <Send className="h-6 w-6" strokeWidth={1.75} />
              </button>
            </div>
            <button type="button" aria-label="Save" className="transition hover:opacity-60">
              <Bookmark className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>

          {/* Like count */}
          <p className="px-4 pt-2 text-sm font-semibold text-neutral-900">
            {formatCount(post.stats.likes)} likes
          </p>

          {/* Caption — username inline, then text */}
          <div className="px-4 pt-1">
            <p className="text-sm leading-relaxed text-neutral-900">
              <span className="font-semibold">{post.author.handle}</span>{' '}
              <span className="text-neutral-800">{post.excerpt}</span>
            </p>
          </div>

          {/* View comments link — opens in app */}
          {post.stats.comments > 0 && (
            <a
              href={deepLink}
              className="mt-1 block px-4 text-sm text-neutral-500 hover:text-neutral-700"
            >
              View all {formatCount(post.stats.comments)} comments
            </a>
          )}

          {/* Open-in-app card */}
          <div className="mt-6 px-4">
            <OpenInAppCTA
              openInAppHref={deepLink}
              appStoreHref={APP_STORE_URL}
              playStoreHref={PLAY_STORE_URL}
              subline={`Like, comment, and follow @${post.author.handle} in DriveLife.`}
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

      <MobileAppBar openInAppHref={deepLink} />
    </>
  );
}
