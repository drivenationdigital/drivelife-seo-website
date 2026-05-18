import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Monitor,
  Ticket,
  Images,
  ExternalLink,
} from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { OpenInAppCTA } from "@/components/OpenInAppCTA";
import {
  getEventById,
  formatEventDateLabel,
  formatEventTimeLabel,
  htmlToPlainText,
  asNumber,
} from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const buildDeepLink = (id: string | number) => `drivelife://event/${id}`;

type Props = {
  params: Promise<{ id: string }>;
};

// Shared Tailwind v4 arbitrary-variant rules for rendered WordPress HTML.
// Cheaper than pulling in @tailwindcss/typography for two blocks of content.
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
  const event = await getEventById(id);
  if (!event) return { title: "Event not found" };

  const url = `${SITE_URL}/event/${event.id}`;
  const cover = event.cover_photo;
  const dateLabel = formatEventDateLabel(event.dates);

  const plainDesc = event.description ? htmlToPlainText(event.description) : "";
  const description =
    plainDesc ||
    [dateLabel, event.location].filter(Boolean).join(" · ") ||
    `${event.title} on DriveLife`;

  return {
    title: event.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: event.title,
      description,
      siteName: "DriveLife",
      images: cover?.url
        ? [
            {
              url: cover.url,
              width: asNumber(cover.width, 1200),
              height: asNumber(cover.height, 630),
              alt: cover.alt || event.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: cover?.url ? [cover.url] : [],
    },
    other: {
      "al:ios:url": buildDeepLink(event.id),
      "al:ios:app_store_id": "XXXXXXXXX",
      "al:ios:app_name": "DriveLife",
      "al:android:url": buildDeepLink(event.id),
      "al:android:package": "com.drivelife.app",
      "al:android:app_name": "DriveLife",
      "al:web:url": url,
    },
  };
}

// ---------- Page ----------

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const deepLink = buildDeepLink(event.id);
  const dateLabel = formatEventDateLabel(event.dates);
  const timeLabel = formatEventTimeLabel(event.dates);
  const cover = event.cover_photo;
  const gallery = event.gallery ?? [];
  const totalImages = (cover ? 1 : 0) + gallery.length;

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-12">
        {/* Cover */}
        {cover?.url ? (
          <figure className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
            <Image
              src={cover.url}
              alt={cover.alt || event.title}
              fill
              priority
              sizes="(min-width: 640px) 600px, 100vw"
              className="object-cover"
            />
            {totalImages > 1 && (
              <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <Images className="h-3.5 w-3.5" />
                {totalImages}
              </div>
            )}
          </figure>
        ) : (
          <div className="aspect-[16/10] w-full bg-neutral-100" />
        )}

        {/* Title + meta + actions */}
        <section className="px-4 pt-6">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-neutral-900">
            {event.title}
          </h1>

          <div className="mt-5 space-y-3 text-sm">
            {dateLabel && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                <span className="text-neutral-900">{dateLabel}</span>
              </div>
            )}
            {timeLabel && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                <span className="text-neutral-900">{timeLabel}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                <span className="text-neutral-900">{event.location}</span>
              </div>
            )}
          </div>

          {/* Action buttons — Favourite always shown; Event Website only if URL exists */}
          <div className="mt-6 flex gap-2">
            <a
              href={deepLink}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gold-500"
            >
              <Heart className="h-4 w-4" />
              Favourite
            </a>
            {event.event_url && (
              <a
                href={event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gold-500"
              >
                <Monitor className="h-4 w-4" />
                Event Website
              </a>
            )}
          </div>
        </section>

        {/* About */}
        {event.description && (
          <section className="mt-10 px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              About
            </h2>
            <div className="mt-2 h-px bg-neutral-200" />
            <div
              className={`mt-4 ${HTML_CONTENT}`}
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </section>
        )}

        {/* Entry & Tickets */}
        {event.entry_details && (
          <section className="mt-10 px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Entry &amp; Tickets
            </h2>
            <div className="mt-2 h-px bg-neutral-200" />
            <div
              className={`mt-4 ${HTML_CONTENT}`}
              dangerouslySetInnerHTML={{ __html: event.entry_details }}
            />
          </section>
        )}

        {/* Direct ticket CTA */}
        {event.has_tickets && event.ticket_url && (
          <div className="mt-6 px-4">
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <Ticket className="h-4 w-4" />
              Get tickets
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          </div>
        )}

        {/* Open-in-app CTA */}
        <div className="mt-12 px-4">
          <OpenInAppCTA
            openInAppHref={deepLink}
            headline="Open in the app"
            subline={`See full details for ${event.title} in DriveLife.`}
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
