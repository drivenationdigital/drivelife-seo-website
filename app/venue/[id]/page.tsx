import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Facebook,
  Instagram,
  Globe,
  Mail,
  Phone,
  Calendar,
  MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { OpenInAppCTA } from "@/components/OpenInAppCTA";
import {
  getVenueById,
  formatVenueEventStart,
  htmlToPlainText,
} from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const buildDeepLink = (id: string | number) => `drivelife://venue/${id}`;

type Props = {
  params: Promise<{ id: string }>;
};

// Same scoped HTML styling as the event page — handles WordPress-flavoured
// description markup without needing @tailwindcss/typography.
const HTML_CONTENT =
  "text-sm leading-relaxed text-neutral-700 " +
  "[&_p]:mb-3 [&_p:last-child]:mb-0 " +
  "[&_a]:text-gold-500 [&_a]:underline [&_a:hover]:text-gold-600 " +
  "[&_strong]:font-semibold [&_strong]:text-neutral-900 " +
  "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-neutral-900 " +
  "[&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:font-semibold [&_h4]:text-neutral-900 " +
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:mb-1";

// ---------- SEO ----------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) return { title: "Venue not found" };

  const url = `${SITE_URL}/venue/${venue.id}`;
  const cover = venue.cover_photo;
  const plainDesc = venue.description ? htmlToPlainText(venue.description) : "";
  const description =
    plainDesc || venue.location || `${venue.title} on DriveLife`;

  return {
    title: venue.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: venue.title,
      description,
      siteName: "DriveLife",
      images: cover?.url
        ? [{ url: cover.url, alt: cover.alt || venue.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: venue.title,
      description,
      images: cover?.url ? [cover.url] : [],
    },
    other: {
      "al:ios:url": buildDeepLink(venue.id),
      "al:ios:app_store_id": "XXXXXXXXX",
      "al:ios:app_name": "DriveLife",
      "al:android:url": buildDeepLink(venue.id),
      "al:android:package": "com.drivelife.app",
      "al:android:app_name": "DriveLife",
      "al:web:url": url,
    },
  };
}

// ---------- Page ----------

type IconButton = {
  icon: LucideIcon;
  href: string;
  label: string;
  external: boolean;
};

export default async function VenuePage({ params }: Props) {
  const { id } = await params;
  const venue = await getVenueById(id);
  if (!venue) notFound();

  const deepLink = buildDeepLink(venue.id);
  const cover = venue.cover_photo;
  const logo = venue.logo;
  const events = venue.events ?? [];

  // Only render icon buttons for fields the venue actually has.
  const iconButtons: IconButton[] = [];
  if (venue.facebook)
    iconButtons.push({
      icon: Facebook,
      href: venue.facebook,
      label: "Facebook",
      external: true,
    });
  if (venue.instagram)
    iconButtons.push({
      icon: Instagram,
      href: venue.instagram,
      label: "Instagram",
      external: true,
    });
  if (venue.website)
    iconButtons.push({
      icon: Globe,
      href: venue.website,
      label: "Website",
      external: true,
    });
  if (venue.venue_email)
    iconButtons.push({
      icon: Mail,
      href: `mailto:${venue.venue_email}`,
      label: "Email",
      external: false,
    });
  if (venue.venue_phone)
    iconButtons.push({
      icon: Phone,
      href: `tel:${venue.venue_phone}`,
      label: "Phone",
      external: false,
    });

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-12">
        {/* Cover + overlapping round logo */}
        <header className="relative">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
            {cover?.url ? (
              <Image
                src={cover.url}
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

          {/* Round logo card */}
          <div className="-mt-12 flex justify-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white shadow-sm ring-[3px] ring-white">
              {logo?.url ? (
                <Image
                  src={logo.url}
                  alt={`${venue.title} logo`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-2xl font-bold text-neutral-500">
                  {venue.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Title + follow + icon row + address */}
        <section className="px-4 pt-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {venue.title}
          </h1>

          {/* Follow — deep-links into the app, no functional follow on web */}
          <div className="mt-4">
            <a
              href={deepLink}
              className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
            >
              Follow
            </a>
          </div>

          {/* Social / contact icon row */}
          {iconButtons.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {iconButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <a
                    key={btn.label}
                    href={btn.href}
                    {...(btn.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    aria-label={btn.label}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-400 text-white transition hover:bg-gold-500"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Address line */}
          {venue.location && (
            <p className="mt-5 text-sm text-neutral-600">{venue.location}</p>
          )}
        </section>

        {/* Upcoming events */}
        {events.length > 0 && (
          <section className="mt-10 px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Upcoming events
            </h2>
            <div className="mt-2 h-px bg-neutral-200" />
            <ul className="mt-2 divide-y divide-neutral-200">
              {events.map((event) => {
                const dateLabel = formatVenueEventStart(event.start_date);
                return (
                  <li key={event.id}>
                    <Link
                      href={`/event/${event.id}`}
                      className="flex items-start gap-3 py-3 transition hover:bg-neutral-50"
                    >
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        {event.thumbnail && (
                          <Image
                            src={event.thumbnail}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
                          {event.title}
                        </p>
                        <div className="mt-1 space-y-0.5 text-xs text-neutral-500">
                          {dateLabel && (
                            <p className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-gold-500" />
                              {dateLabel}
                            </p>
                          )}
                          {event.location && (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 shrink-0 text-gold-500" />
                              <span className="truncate">{event.location}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* About */}
        {venue.description && (
          <section className="mt-10 px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              About
            </h2>
            <div className="mt-2 h-px bg-neutral-200" />
            <div
              className={`mt-4 ${HTML_CONTENT}`}
              dangerouslySetInnerHTML={{ __html: venue.description }}
            />
          </section>
        )}

        {/* Open-in-app CTA */}
        <div className="mt-12 px-4">
          <OpenInAppCTA
            openInAppHref={deepLink}
            headline="Open in the app"
            subline={`Follow ${venue.title}, see all events and posts in DriveLife.`}
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
