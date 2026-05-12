import { DriveLifeLogo } from './DriveLifeLogo';

type Props = {
  openInAppHref: string;
};

/**
 * Sticky bottom bar shown on mobile only. Universal-link tap
 * that opens the app if installed, falls back to the store.
 */
export function MobileAppBar({ openInAppHref }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-md sm:hidden">
      <div className="mx-auto flex max-w-[600px] items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex items-center gap-3">
          <DriveLifeLogo />
        </div>
        <a
          href={openInAppHref}
          className="shrink-0 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
        >
          Open in app
        </a>
      </div>
    </div>
  );
}
