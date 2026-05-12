import Link from 'next/link';
import { DriveLifeLogo } from './DriveLifeLogo';

type Props = {
  openInAppHref?: string;
};

export function SiteHeader({ openInAppHref = '#' }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[600px] items-center justify-between px-4">
        <Link href="/" aria-label="DriveLife home" className="flex items-center">
          <DriveLifeLogo />
        </Link>
        <Link
          href={openInAppHref}
          className="rounded-full bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
        >
          Open in app
        </Link>
      </div>
    </header>
  );
}
