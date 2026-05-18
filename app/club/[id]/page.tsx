import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Car, Users, BadgeCheck, Share2, Plus } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { OpenInAppCTA } from "@/components/OpenInAppCTA";
import { MobileAppBar } from "@/components/MobileAppBar";
import { getClubById, formatNumber } from "@/lib/api";

// ----- Config -----
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const buildDeepLink = (id: string | number) => `drivelife://club/${id}`;

type Props = {
  params: Promise<{ id: string }>;
};

// ---------- SEO + share-card metadata ----------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const club = await getClubById(id);
  if (!club) return { title: "Club not found" };

  const url = `${SITE_URL}/club/${club.id}`;
  const memberStr = formatNumber(club.member_count);
  const title = club.title;
  const description = `${club.title} on DriveLife · ${memberStr} members`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "DriveLife",
      images: club.cover_image
        ? [{ url: club.cover_image, alt: club.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: club.cover_image ? [club.cover_image] : [],
    },
    other: {
      "al:ios:url": buildDeepLink(club.id),
      "al:ios:app_store_id": "XXXXXXXXX",
      "al:ios:app_name": "DriveLife",
      "al:android:url": buildDeepLink(club.id),
      "al:android:package": "com.drivelife.app",
      "al:android:app_name": "DriveLife",
      "al:web:url": url,
    },
  };
}

// ---------- Page ----------

export default async function ClubPage({ params }: Props) {
  const { id } = await params;
  const club = await getClubById(id);
  if (!club) notFound();

  const deepLink = buildDeepLink(club.id);
  const memberStr = formatNumber(club.member_count);

  // Show category if API provides it; otherwise fall back to location,
  // then to a generic "Car Club" so the meta row never goes empty.
  const primaryMeta =
    club.category?.trim() || club.location?.trim() || "Car Club";

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-24 sm:pb-12">
        {/* Cover + overlapping logo card */}
        <header className="relative">
          <div className="relative aspect-[5/2] w-full overflow-hidden bg-neutral-100">
            {club.cover_image ? (
              <Image
                src={club.cover_image}
                alt=""
                fill
                priority
                sizes="(min-width: 640px) 600px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
            )}
          </div>

          {/* Logo card — sits over the cover's bottom edge */}
          <div className="-mt-12 flex justify-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-neutral-900 shadow-sm ring-[3px] ring-white">
              {club.logo ? (
                <Image
                  src={club.logo}
                  alt={`${club.title} logo`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                  {club.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Title + meta + actions */}
        <section className="px-4 pt-4 text-center">
          <h1 className="inline-flex items-center gap-1.5 text-2xl font-bold tracking-tight text-neutral-900">
            <span>{club.title}</span>
            {club.is_verified && (
              <BadgeCheck
                className="h-5 w-5 text-gold-500"
                aria-label="Verified"
              />
            )}
          </h1>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <Car className="h-4 w-4" aria-hidden />
              {primaryMeta}
            </span>
            <span aria-hidden className="text-neutral-300">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden />
              {memberStr} members
            </span>
          </div>

          {/* Action buttons — visual only, taps deep-link to the app */}
          <div className="mt-5 flex gap-2">
            <a
              href={deepLink}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gold-500"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Join Club
            </a>
            <a
              href={deepLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
            >
              <Share2 className="h-4 w-4" />
              Share
            </a>
          </div>
        </section>

        {/* Posts placeholder + CTA */}
        <section className="mt-8 border-t border-neutral-200">
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-neutral-700">
              Posts from this club
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              See all posts and chat with members in the DriveLife app.
            </p>
          </div>

          <div className="px-4">
            <OpenInAppCTA
              openInAppHref={deepLink}
              headline="See everything in the app"
              subline={`Join ${club.title}, follow ${memberStr} members, and see club posts in DriveLife.`}
            />
          </div>
        </section>

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
