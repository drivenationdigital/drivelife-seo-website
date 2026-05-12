// Live fetcher for DriveLife posts.
// Endpoint is registered in WordPress via:
//   register_rest_route('app/v2', 'get-post', [...])
// which means the real path is /wp-json/app/v2/get-post.
//
// PHP returns the post object directly:
//   $response = new WP_REST_Response($post, 200);
// so we DO NOT unwrap a `.data` field.

const API_BASE = "https://www.carevents.com/uk/wp-json/app/v2";

// ---------- Types ----------

export type ApiMedia = {
  id: string;
  post_id: string;
  media_type: "image" | "video" | string;
  media_mime_type: string;
  media_alt: string;
  media_width: string; // numeric string
  media_height: string; // numeric string
  media_url: string;
  server: string;
  is_video_ready: string; // "0" | "1"
  blurred_url: string;
};

export type ApiPost = {
  id: string;
  event_id: string | null;
  user_id: string;
  caption: string;
  location: string;
  post_date: string; // "YYYY-MM-DD HH:mm:ss" (server local, treated as UTC below)
  updated_at: string | null;
  garage_id: string | null;
  news_id: string | null;
  club_id: string | null;
  venue_id: string | null;
  asc_link_type: string | null;
  asc_link: string | null;
  media: ApiMedia[];
  user_profile_image: string | null;
  likes_count: number;
  comments_count: number;
  username: string; // user_login OR club/venue title when applicable
  user_verified: boolean;
  is_liked?: boolean; // only set when user_id query param is sent
  // Set by the PHP when the post belongs to a club or venue instead of a user.
  is_club_post?: boolean;
  is_venue_post?: boolean;
};

// ---------- Fetcher ----------

/**
 * Fetch a single post by its numeric id. Server-side only.
 *
 * We intentionally do NOT pass `user_id` — this is a public web preview, not
 * a personalised feed. The endpoint already sets `Cache-Control: max-age=3600`,
 * and Next adds another revalidate layer below.
 */
export async function getPostById(id: string): Promise<ApiPost | null> {
  try {
    const url = `${API_BASE}/get-post?post_id=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`[getPostById] HTTP ${res.status} for id=${id}`);
      return null;
    }

    const post = (await res.json()) as ApiPost | null;
    // PHP returns the post object directly. Guard against the rare case where
    // it returns nothing or an error shape — handle anything without an id.
    if (!post || typeof post !== "object" || !("id" in post)) {
      console.error("[getPostById] unexpected response shape", post);
      return null;
    }
    return post;
  } catch (err) {
    console.error("[getPostById] fetch error:", err);
    return null;
  }
}

// ---------- Helpers ----------

/**
 * Parse the WordPress "YYYY-MM-DD HH:mm:ss" format into a Date.
 * Treats the value as UTC for stable relative-time formatting across timezones.
 */
export function parseServerDate(raw: string): Date {
  // "2026-04-29 22:31:47" -> "2026-04-29T22:31:47Z"
  return new Date(raw.replace(" ", "T") + "Z");
}

export function formatCount(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

/**
 * Coerce numeric string fields (media_width / media_height) into numbers,
 * with a safe fallback if the field is missing or unparseable.
 */
export function asNumber(
  value: string | number | null | undefined,
  fallback = 0,
): number {
  if (value == null) return fallback;
  const n = typeof value === "number" ? value : parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Display name for an author — clubs and venues don't get an "@" prefix
 * since their `username` is the club/venue title, not a user_login handle.
 */
export function authorDisplayName(post: ApiPost): string {
  if (post.is_club_post || post.is_venue_post) return post.username;
  return `@${post.username}`;
}
