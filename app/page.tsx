import type { Metadata } from "next";
import Image from "next/image";

// ---------- Config ----------
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://drivelife.com";
const APP_STORE_URL =
  "https://apps.apple.com/us/app/carcalendar/id1500589187?ls=1";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.app.carcalendar";

const DESCRIPTION =
  "The home of car culture. Events, builds, meets and the people behind them.";

// ---------- Metadata ----------
export const metadata: Metadata = {
  title: "DriveLife — Get the app",
  description: DESCRIPTION,
  openGraph: {
    title: "DriveLife",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "DriveLife",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "DriveLife",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DriveLife",
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
};

// ---------- Page ----------
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      {/* Centered hero — logo + store buttons */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <Image
          src="/download-splash1.jpg"
          alt="DriveLife"
          width={2529}
          height={289}
          priority
          className="h-auto w-full"
        />

        <div className="mt-12 flex w-full flex-col gap-3">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download on the App Store"
            className="group flex items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-black px-5 py-3 transition hover:border-neutral-500 hover:bg-neutral-900"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 fill-white"
              aria-hidden="true"
            >
              <path d="M17.05 12.46c-.03-2.84 2.32-4.2 2.42-4.27-1.32-1.93-3.38-2.2-4.11-2.22-1.74-.18-3.4 1.03-4.28 1.03-.9 0-2.25-1.01-3.71-.98-1.9.03-3.66 1.11-4.64 2.81-2 3.46-.51 8.58 1.43 11.39.95 1.37 2.07 2.91 3.54 2.86 1.43-.06 1.97-.92 3.69-.92 1.72 0 2.21.92 3.71.89 1.53-.03 2.5-1.4 3.43-2.78 1.08-1.6 1.52-3.14 1.55-3.22-.03-.01-2.96-1.14-2.99-4.59zM14.27 4.07c.78-.94 1.31-2.25 1.16-3.55-1.13.05-2.5.75-3.31 1.69-.72.83-1.36 2.17-1.19 3.45 1.27.1 2.56-.64 3.34-1.59z" />
            </svg>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] text-neutral-300">
                Download on the
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                App Store
              </span>
            </span>
          </a>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get it on Google Play"
            className="group flex items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-black px-5 py-3 transition hover:border-neutral-500 hover:bg-neutral-900"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
              <path
                d="M3.6 1.7C3.2 2 3 2.5 3 3.2v17.6c0 .7.2 1.2.6 1.5l.1.1L13.5 13l-9.8-11.3z"
                fill="#34A853"
              />
              <path
                d="M17 16.5l-3.5-3.5 3.5-3.5 4.1 2.3c1.2.7 1.2 1.8 0 2.5L17 16.5z"
                fill="#FBBC04"
              />
              <path
                d="M13.5 13l3.5 3.5-13.4 7.6c-.4-.1-.8-.4-.9-.8l10.8-10.3z"
                fill="#EA4335"
              />
              <path
                d="M13.5 13L2.7 2.7c.1-.5.5-.7.9-.8L17 9.5 13.5 13z"
                fill="#4285F4"
              />
            </svg>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-wider text-neutral-300">
                Get it on
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                Google Play
              </span>
            </span>
          </a>
        </div>
      </div>

      {/* Footer pinned to the bottom */}
      <footer className="pb-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} DriveLife
      </footer>
    </main>
  );
}
