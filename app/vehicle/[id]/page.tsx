import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gauge, Timer, Wind, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { OpenInAppCTA } from "@/components/OpenInAppCTA";
import { getVehicleById, vehicleTitle, htmlToPlainText } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const buildDeepLink = (id: string | number) => `drivelife://vehicle/${id}`;

type Props = {
  params: Promise<{ id: string }>;
};

// Nothing on this page shows the vehicle's registration, and that is on
// purpose. /get-garage is unauthenticated and returns the plate in its
// response, but a plate on a public page is a lookup anybody can run against
// a car they photographed in a car park. In the app a registration is shown
// only to the person who owns it; a logged-out web page is not the place to
// undo that.

// ---------- SEO ----------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) return { title: "Vehicle not found" };

  const title = vehicleTitle(vehicle);
  const owner = vehicle.owner?.username;
  const url = `${SITE_URL}/vehicle/${vehicle.id}`;
  const cover = vehicle.cover_photo ?? undefined;

  const plainDesc = vehicle.description
    ? htmlToPlainText(vehicle.description)
    : "";
  const description =
    plainDesc ||
    (owner ? `${title} — @${owner}'s vehicle on DriveLife` : `${title} on DriveLife`);

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
      images: cover ? [{ url: cover, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover] : [],
    },
    other: {
      "al:ios:url": buildDeepLink(vehicle.id),
      "al:ios:app_store_id": "XXXXXXXXX",
      "al:ios:app_name": "DriveLife",
      "al:android:url": buildDeepLink(vehicle.id),
      "al:android:package": "com.drivelife.app",
      "al:android:app_name": "DriveLife",
      "al:web:url": url,
    },
  };
}

// ---------- Page ----------

type Spec = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export default async function VehiclePage({ params }: Props) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  const title = vehicleTitle(vehicle);
  const deepLink = buildDeepLink(vehicle.id);
  const owner = vehicle.owner;
  const cover = vehicle.cover_photo;

  // Only the figures that were actually filled in. A spec sheet of zeroes
  // says the car has no power rather than that nobody typed a number.
  const specs: Spec[] = [];
  if (vehicle.vehicle_bhp)
    specs.push({
      icon: Gauge,
      label: "Power",
      value: `${vehicle.vehicle_bhp} bhp`,
    });
  if (vehicle.vehicle_062)
    specs.push({
      icon: Timer,
      label: "0–62 mph",
      value: `${vehicle.vehicle_062}s`,
    });
  if (vehicle.vehicle_top_speed)
    specs.push({
      icon: Wind,
      label: "Top speed",
      value: `${vehicle.vehicle_top_speed} mph`,
    });
  if (vehicle.mods_count)
    specs.push({
      icon: Wrench,
      label: "Modifications",
      value: String(vehicle.mods_count),
    });

  return (
    <>
      <SiteHeader openInAppHref={deepLink} />

      <main className="mx-auto max-w-[600px] pb-12">
        {/* Cover */}
        <header className="relative">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
            {cover ? (
              <Image
                src={cover}
                alt={title}
                fill
                priority
                sizes="(min-width: 640px) 600px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
            )}
          </div>
        </header>

        {/* Title + owner */}
        <section className="px-4 pt-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {title}
          </h1>

          {vehicle.colour && (
            <p className="mt-1 text-sm text-neutral-500">{vehicle.colour}</p>
          )}

          {owner?.username && (
            <Link
              href={`/profile/${owner.username}`}
              className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-neutral-100 px-3.5 py-2 transition hover:bg-neutral-200"
            >
              <span className="relative h-7 w-7 overflow-hidden rounded-full bg-neutral-200">
                {owner.profile_image ? (
                  <Image
                    src={owner.profile_image}
                    alt=""
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                    {(owner.name ?? owner.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold text-neutral-900">
                @{owner.username}
              </span>
            </Link>
          )}
        </section>

        {/* Specs */}
        {specs.length > 0 && (
          <section className="mt-8 px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Specification
            </h2>
            <div className="mt-2 h-px bg-neutral-200" />
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {specs.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={spec.label}
                    className="rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Icon className="h-3.5 w-3.5 text-gold-500" />
                      {spec.label}
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-neutral-900">
                      {spec.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        {/* About */}
        {vehicle.description && (
          <section className="mt-10 px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              About
            </h2>
            <div className="mt-2 h-px bg-neutral-200" />
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {htmlToPlainText(vehicle.description, 2000)}
            </p>
          </section>
        )}

        {/* Open-in-app CTA */}
        <div className="mt-12 px-4">
          <OpenInAppCTA
            openInAppHref={deepLink}
            headline="Open in the app"
            subline={`See every photo of this ${vehicle.make ?? "car"}, its mods and where it has been.`}
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
