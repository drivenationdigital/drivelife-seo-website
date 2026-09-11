"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

import type { ApiGalleryPhoto } from "@/lib/api";
import { TagChip } from "./TagChip";

type Props = {
  galleryId: number;
  title: string;
  photos: ApiGalleryPhoto[];
  /** The photo to lead with: the one in ?photo=, else the gallery's cover. */
  initialId: number;
  /** Rendered between the lead photo and the grid — the title block. */
  children?: ReactNode;
};

/**
 * The lead photo and the grid, swapping on the client.
 *
 * Tiles used to be plain links to `?photo=N`, so every tap was a full server
 * round trip: re-render the page, re-read the gallery, then fetch the image.
 * Now a tap swaps state in place and the URL is updated with replaceState, so
 * it is still the shareable `?photo=` link without anything being reloaded.
 *
 * Three things make the swap feel instant rather than merely quick:
 *
 *  - the tile's thumbnail is already in the browser cache, so it goes under
 *    the lead straight away and the full image sharpens over it;
 *  - the neighbours' full images are fetched ahead of time, so stepping
 *    through is usually a cache hit;
 *  - images bypass Next's optimiser. Cloudflare already serves sized variants,
 *    and re-encoding them on this server added a hop to every first view —
 *    and meant a preload of the real URL never warmed what was shown.
 */
export function GalleryViewer({
  galleryId,
  title,
  photos,
  initialId,
  children,
}: Props) {
  const [currentId, setCurrentId] = useState(initialId);
  const leadRef = useRef<HTMLDivElement>(null);

  const found = photos.findIndex((p) => p.id === currentId);
  const index = found < 0 ? 0 : found;
  const current = photos[index];

  const show = useCallback(
    (id: number, scrollToLead: boolean) => {
      setCurrentId(id);

      // replaceState, not pushState: stepping through forty photos should not
      // take forty presses of Back to leave the page.
      window.history.replaceState(null, "", `/gallery/${galleryId}?photo=${id}`);

      // Only when the lead has scrolled out of sight. Jumping the page to the
      // top when the photo is already on screen is worse than not moving.
      const lead = leadRef.current;
      if (scrollToLead && lead && lead.getBoundingClientRect().top < 0) {
        lead.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [galleryId],
  );

  const step = useCallback(
    (delta: number) => {
      if (photos.length < 2) return;
      const next = photos[(index + delta + photos.length) % photos.length];
      show(next.id, false);
    },
    [index, photos, show],
  );

  // Warm the next photos, so stepping through is usually a cache hit.
  useEffect(() => {
    if (photos.length < 2) return;

    for (const offset of [1, -1, 2]) {
      const p = photos[(index + offset + photos.length) % photos.length];
      if (p && p.id !== currentId) {
        const img = new window.Image();
        img.src = p.url;
      }
    }
  }, [index, currentId, photos]);

  // Arrow keys on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  if (!current) return <>{children}</>;

  return (
    <>
      {/* Lead photo, full bleed like the app's cover */}
      <figure className="relative">
        <div
          ref={leadRef}
          className="relative aspect-[4/3] w-full scroll-mt-14 overflow-hidden bg-neutral-100"
        >
          {/* Underneath: the thumbnail, already cached from the grid. */}
          <Image
            key={`thumb-${current.id}`}
            src={current.thumb}
            alt=""
            aria-hidden
            fill
            unoptimized
            className="object-cover"
          />
          {/* On top: the full image, which sharpens over it when it lands. */}
          <Image
            key={`full-${current.id}`}
            src={current.url}
            alt={title}
            fill
            unoptimized
            priority
            className="object-cover"
          />

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
                {index + 1} / {photos.length}
              </span>
            </>
          )}
        </div>

        {current.tags.length > 0 && (
          <figcaption className="flex flex-wrap gap-1.5 px-4 pt-3">
            {current.tags.map((tag) => (
              <TagChip key={`${tag.type}-${tag.id}`} tag={tag} />
            ))}
          </figcaption>
        )}
      </figure>

      {children}

      {/* Every photo, as tiles. Three across and a 2px gutter, which is what
          the app uses. The current one stays in the grid, ringed, rather than
          being taken out of it: a grid that reflows on every tap moves the
          next tile out from under your finger. */}
      {photos.length > 1 && (
        <section className="mt-6">
          <div className="grid grid-cols-3 gap-0.5">
            {photos.map((p) => {
              const active = p.id === current.id;

              return (
                <a
                  key={p.id}
                  // A real link, so crawlers and anyone without JavaScript
                  // still reach each photo's own URL.
                  href={`/gallery/${galleryId}?photo=${p.id}`}
                  onClick={(e) => {
                    // Leave new-tab and modified clicks to the browser.
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
                      return;
                    }
                    e.preventDefault();
                    show(p.id, true);
                  }}
                  aria-current={active ? "true" : undefined}
                  aria-label={`View photo ${photos.indexOf(p) + 1} of ${photos.length}`}
                  className="relative block aspect-square overflow-hidden bg-neutral-100"
                >
                  <Image
                    src={p.thumb}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover transition duration-150 hover:opacity-90"
                  />

                  {p.tags.length > 0 && (
                    <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <User className="h-2.5 w-2.5" />
                      {p.tags.length}
                    </span>
                  )}

                  {/* Over the image, not on the tile: an inset ring is painted
                      beneath child content, so the photo would hide it. */}
                  {active && (
                    <span className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-gold-400" />
                  )}
                </a>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
