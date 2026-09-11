import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";

import type { ApiGalleryTag } from "@/lib/api";

/**
 * One tagged person or vehicle, linking to their page.
 *
 * Its own file because both the server page (gallery-wide tags) and the client
 * viewer (the current photo's tags) render it.
 */
export function TagChip({ tag }: { tag: ApiGalleryTag }) {
  const label = tag.type === "user" ? `@${tag.username}` : tag.name;

  return (
    <Link
      href={tag.href}
      className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 py-1 pl-1 pr-3 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-200"
    >
      <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-neutral-200">
        {tag.image ? (
          <Image src={tag.image} alt="" fill sizes="20px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <User className="h-3 w-3 text-neutral-500" />
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
