import { AppStoreBadges } from '../app/AppStoreBadges';
import { DriveLifeLogo } from './DriveLifeLogo';

type Props = {
  openInAppHref: string;
  appStoreHref?: string;
  playStoreHref?: string;
  headline?: string;
  subline?: string;
};

const APP_STORE_URL =
  "https://apps.apple.com/us/app/carcalendar/id1500589187?ls=1";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.app.carcalendar";

export function OpenInAppCTA({
  openInAppHref,
  appStoreHref,
  playStoreHref,
  headline = 'Better in the app',
  subline = 'Like, comment, follow and see the rest of the photos in DriveLife.',
}: Props) {
  return (
    <section
      aria-label="Open in DriveLife app"
      className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col items-center mx-auto text-center"
    >
      <div className="flex items-center justify-between gap-3">
        <DriveLifeLogo />
      </div>
      {/* 
      <h3 className="mt-3 text-base font-semibold text-neutral-900">{headline}</h3>
      <p className="mt-1 text-sm text-neutral-500">{subline}</p>

      <a
        href={openInAppHref}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
      >
        <Smartphone className="h-4 w-4" />
        Open in DriveLife
      </a> */}

      <p className="mt-4 text-xs font-medium text-neutral-400">{subline}</p>
      <div className="mt-2">
        <AppStoreBadges
          appStoreHref={appStoreHref ?? APP_STORE_URL}
          playStoreHref={playStoreHref ?? PLAY_STORE_URL}
        />
      </div>
    </section>
  );
}
