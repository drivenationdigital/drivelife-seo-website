// Live fetchers for DriveLife.
//
// Endpoints (all under WordPress REST):
//   /wp-json/app/v2/get-post                    (single post)
//   /wp-json/app/v2/get-event                   (single event)
//   /wp-json/app/v2/get-venue                   (single venue + upcoming events)
//   /wp-json/app/v2/get-user-profile-next       (user profile by id or username)
//   /wp-json/app/v2/get-user-posts              (paged user posts)
//   /wp-json/app/v1/club-details/{id}           (club details)

const API_ROOT = "https://www.carevents.com/uk/wp-json/app";
const API_V1 = `${API_ROOT}/v1`;
const API_V2 = `${API_ROOT}/v2`;

// =====================================================================
// Posts
// =====================================================================

export type ApiMedia = {
  id: string;
  post_id: string;
  media_type: "image" | "video" | string;
  media_mime_type: string;
  media_alt: string;
  media_width: string;
  media_height: string;
  media_url: string;
  server: string;
  is_video_ready: string;
  blurred_url: string;
};

export type ApiPost = {
  id: string;
  event_id: string | null;
  user_id: string;
  caption: string;
  location: string;
  post_date: string;
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
  username: string;
  user_verified: boolean;
  is_liked?: boolean;
  is_club_post?: boolean;
  is_venue_post?: boolean;
};

export async function getPostById(id: string): Promise<ApiPost | null> {
  try {
    const url = `${API_V2}/get-post?post_id=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`[getPostById] HTTP ${res.status} for id=${id}`);
      return null;
    }
    const post = (await res.json()) as ApiPost | null;
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

// =====================================================================
// Clubs
// =====================================================================

export type ApiClub = {
  id: string | number;
  title: string;
  cover_image: string | null;
  logo: string | null;
  member_count: number;
  club_type?: string | null;
  location?: string | null;
  category?: string | null;
  is_verified: boolean;
};

type ApiClubResponse = {
  success: boolean;
  club?: ApiClub;
  message?: string;
};

export async function getClubById(id: string): Promise<ApiClub | null> {
  try {
    const url = `${API_V1}/club-details/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`[getClubById] HTTP ${res.status} for id=${id}`);
      return null;
    }
    const json = (await res.json()) as ApiClubResponse;
    if (!json?.success || !json.club) {
      console.error("[getClubById] unsuccessful response", json);
      return null;
    }
    return json.club;
  } catch (err) {
    console.error("[getClubById] fetch error:", err);
    return null;
  }
}

// =====================================================================
// Events
// =====================================================================

export type ApiEventImage = {
  id?: string | number;
  type?: string;
  url: string;
  mime_type?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
};

export type ApiEvent = {
  id: string | number;
  title: string;
  dates?: unknown;
  location?: string | null;
  description?: string | null;
  entry_details?: string | null;
  cover_photo?: ApiEventImage | null;
  gallery?: ApiEventImage[];
  likes?: number | string | null;
  comments?: number | string | null;
  ticket_url?: string | null;
  has_tickets?: boolean;
  is_liked?: boolean;
  is_owner?: boolean;
  event_url?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  longitude?: string | number | null;
  latitude?: string | number | null;
  site?: "GB" | "US" | string;
};

export async function getEventById(
  id: string,
  site: "GB" | "US" = "GB",
): Promise<ApiEvent | null> {
  try {
    const params = new URLSearchParams({ event_id: id, site });
    const url = `${API_V2}/get-event?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`[getEventById] HTTP ${res.status} for id=${id}`);
      return null;
    }
    const event = (await res.json()) as ApiEvent | { message: string };
    if (!event || typeof event !== "object" || !("id" in event)) {
      console.error("[getEventById] unexpected response shape", event);
      return null;
    }
    return event as ApiEvent;
  } catch (err) {
    console.error("[getEventById] fetch error:", err);
    return null;
  }
}

// ---------- Event date/time helpers ----------

type EventDateRow = {
  date_from?: string;
  date_to?: string;
  time_from?: string;
  time_to?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  time?: string;
};

function getFirstDateRow(dates: unknown): EventDateRow | null {
  if (typeof dates === "string") return { date_from: dates };
  if (Array.isArray(dates) && dates.length > 0) {
    const first = dates[0];
    if (first && typeof first === "object") return first as EventDateRow;
  }
  if (dates && typeof dates === "object") return dates as EventDateRow;
  return null;
}

function parseFlexibleDate(raw: unknown): Date | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  let d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;

  const ymd = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (ymd) {
    d = new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const withTime = s.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/);
  if (withTime) {
    d = new Date(`${withTime[1]}T${withTime[2]}Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function formatTimeOfDay(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return min === 0
    ? `${h}${period}`
    : `${h}:${String(min).padStart(2, "0")}${period}`;
}

export function formatEventDateLabel(dates: unknown): string | null {
  const row = getFirstDateRow(dates);
  if (!row) return null;
  const from = parseFlexibleDate(row.date_from ?? row.date ?? row.start_date);
  if (!from) return null;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(from);
}

export function formatEventTimeLabel(dates: unknown): string | null {
  const row = getFirstDateRow(dates);
  if (!row) return null;
  const from = row.time_from ?? row.start_time ?? row.time;
  const to = row.time_to ?? row.end_time;
  if (!from) return null;
  const fromStr = formatTimeOfDay(from);
  if (!fromStr) return null;
  if (!to) return fromStr;
  const toStr = formatTimeOfDay(to);
  return toStr ? `${fromStr} - ${toStr}` : fromStr;
}

// =====================================================================
// Venues
// =====================================================================

export type ApiVenueImage = {
  id?: string | number;
  type?: string;
  url: string;
  alt?: string;
};

export type ApiVenueEvent = {
  id: string | number;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  entry_type: string | number;
  tickets_url: string;
  thumbnail: string;
};

export type ApiVenue = {
  id: string | number;
  title: string;
  location?: string | null;
  description?: string | null;
  cover_photo?: ApiVenueImage | null;
  logo?: ApiVenueImage | null;
  venue_email?: string | null;
  venue_phone?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  events?: ApiVenueEvent[];
  is_following?: boolean;
  is_owner?: boolean;
  status?: string;
};

export async function getVenueById(
  id: string,
  site: "GB" | "US" = "GB",
): Promise<ApiVenue | null> {
  try {
    const params = new URLSearchParams({ venue_id: id, site });
    const url = `${API_V2}/get-venue?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`[getVenueById] HTTP ${res.status} for id=${id}`);
      return null;
    }
    const venue = (await res.json()) as ApiVenue | { message: string };
    if (!venue || typeof venue !== "object" || !("id" in venue)) {
      console.error("[getVenueById] unexpected response shape", venue);
      return null;
    }
    return venue as ApiVenue;
  } catch (err) {
    console.error("[getVenueById] fetch error:", err);
    return null;
  }
}

// =====================================================================
// Galleries
// =====================================================================

export type ApiGalleryTag =
  | {
      type: "user";
      id: number;
      username: string;
      name: string | null;
      image: string | null;
      href: string;
    }
  | {
      type: "vehicle";
      id: number;
      name: string;
      image: string | null;
      owner: {
        user_id: number;
        username: string;
        name: string;
        avatar: string | null;
      } | null;
      href: string;
    };

export type ApiGalleryPhoto = {
  id: number;
  /** The photo the owner chose to lead with, as the app shows it. */
  is_cover?: boolean;
  url: string;
  thumb: string;
  taken_at: string | null;
  created_at: string | null;
  tags: ApiGalleryTag[];
};

export type ApiGallery = {
  id: number;
  title: string;
  country: string | null;
  created_at: string | null;
  photo_count: number;
  owner: {
    user_id: number;
    username: string;
    display_name: string;
    avatar: string | null;
  } | null;
};

export type ApiGalleryResponse = {
  gallery: ApiGallery;
  tags: ApiGalleryTag[];
  photos: ApiGalleryPhoto[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

// The public read endpoint, which is deliberately not the one the app uses:
// it answers the same for everybody, carries only approved tags, and never
// includes a registration.
async function fetchGalleryPage(
  id: string,
  page: number,
): Promise<ApiGalleryResponse | null> {
  try {
    const params = new URLSearchParams({
      gallery_id: id,
      page: String(page),
      per_page: String(GALLERY_PAGE_SIZE),
    });
    const url = `${API_V2}/public/gallery?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      // 404 is an ordinary answer here — a deleted or private gallery — so it
      // is not worth a console error on every crawl.
      if (res.status !== 404) {
        console.error(`[getGalleryById] HTTP ${res.status} for id=${id} page=${page}`);
      }
      return null;
    }
    const body = (await res.json()) as
      | (ApiGalleryResponse & { success: true })
      | { success: false };

    if (!body || typeof body !== "object" || !("gallery" in body)) {
      return null;
    }
    return body as ApiGalleryResponse;
  } catch (err) {
    console.error("[getGalleryById] fetch error:", err);
    return null;
  }
}

/** The endpoint's own ceiling per request. */
const GALLERY_PAGE_SIZE = 60;

/**
 * Pages fetched at most — 1,200 photos. A backstop against a runaway count,
 * well above any gallery the app can produce.
 */
const GALLERY_MAX_PAGES = 20;

/**
 * A gallery with EVERY photo, not just the first page.
 *
 * The endpoint caps a request at 60, and this used to ask for page one only,
 * so a large gallery silently stopped at 60. The remaining pages are fetched
 * together rather than one after another, so a 200-photo gallery costs about
 * what two requests do.
 */
export async function getGalleryById(
  id: string,
): Promise<ApiGalleryResponse | null> {
  const first = await fetchGalleryPage(id, 1);
  if (!first) return null;

  const pages = Math.min(first.total_pages || 1, GALLERY_MAX_PAGES);
  if (pages <= 1) return first;

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => fetchGalleryPage(id, i + 2)),
  );

  // Gallery-wide tags and the gallery itself are the same on every page, so
  // only the photos are merged. A page that failed is skipped rather than
  // failing the whole gallery.
  const seen = new Set(first.photos.map((p) => p.id));
  const photos = [...first.photos];

  for (const page of rest) {
    for (const photo of page?.photos ?? []) {
      if (!seen.has(photo.id)) {
        seen.add(photo.id);
        photos.push(photo);
      }
    }
  }

  return { ...first, photos, page: 1, per_page: photos.length, total_pages: 1 };
}

/** The flag for a two-letter country code, or "" when it is not one. */
export function countryFlag(code: string | null | undefined): string {
  const iso = (code ?? "").trim().toUpperCase();
  if (iso.length !== 2) return "";

  const first = iso.codePointAt(0)!;
  const second = iso.codePointAt(1)!;
  const A = 65;
  const Z = 90;
  if (first < A || first > Z || second < A || second > Z) return "";

  const BASE = 0x1f1e6;
  return String.fromCodePoint(BASE + first - A, BASE + second - A);
}

// =====================================================================
// Media
// =====================================================================

// Cloudflare Stream: customer-<code>.cloudflarestream.com/<id>/... and the
// older videodelivery.net/<id>/... Both put the video id first in the path.
const STREAM_URL =
  /^(https:\/\/(?:customer-[a-z0-9]+\.cloudflarestream\.com|videodelivery\.net))\/([a-f0-9]{32})/i;

/**
 * Something an <Image> can actually show for a piece of media.
 *
 * For a video the API's media_url is the HLS manifest —
 * .../manifest/video.m3u8 — which is a playlist, not a picture. Handed to an
 * <Image> it is a broken image, which is what every video post looked like.
 * Stream serves a still for every video at /thumbnails/thumbnail.jpg; this
 * swaps one for the other.
 *
 * Null for a video we cannot find an id in, so the caller shows a placeholder
 * rather than trying to render a manifest. Anything else passes through.
 */
export function mediaThumb(
  url: string | null | undefined,
  mediaType?: string | null,
): string | null {
  if (!url) return null;

  const stream = url.match(STREAM_URL);
  if (stream) return `${stream[1]}/${stream[2]}/thumbnails/thumbnail.jpg`;

  if (mediaType === "video") return null;

  return url;
}

/**
 * Cloudflare Stream's own player for a video, or null if it is not one.
 *
 * A video's media_url is an HLS manifest. Safari plays that in a plain
 * <video>, Chrome and Firefox do not — and handed to <Image>, as the post page
 * used to, it is not a picture at all and next/image refuses it outright.
 * Stream's hosted player handles HLS everywhere, sizes itself, and adapts
 * quality to the connection, so the page does not need a player of its own.
 */
export function streamEmbed(url: string | null | undefined): string | null {
  if (!url) return null;

  const stream = url.match(STREAM_URL);
  if (!stream) return null;

  const [, base, id] = stream;
  const poster = encodeURIComponent(`${base}/${id}/thumbnails/thumbnail.jpg`);

  // preload=metadata: the page loads, the video does not until it is played.
  return `${base}/${id}/iframe?poster=${poster}&preload=metadata`;
}

// =====================================================================
// Vehicles
// =====================================================================

export type ApiVehicleOwner = {
  name?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_image?: string | null;
  user_verified?: boolean;
};

// Deliberately narrower than what the endpoint returns.
//
// /get-garage is unauthenticated and responds with SELECT * — including the
// vehicle's REGISTRATION. That is a plate lookup for anyone who can count, and
// the app has just been through a round of work to keep registrations away
// from people who are not the owner. It is not typed here so it cannot be
// rendered here by accident.
export type ApiVehicle = {
  id: string | number;
  owner_id?: string | number;
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  colour?: string | null;
  cover_photo?: string | null;
  description?: string | null;
  vehicle_bhp?: number;
  vehicle_062?: number;
  vehicle_top_speed?: number;
  mods_count?: number;
  status?: string;
  owner?: ApiVehicleOwner | null;
};

export async function getVehicleById(id: string): Promise<ApiVehicle | null> {
  try {
    const params = new URLSearchParams({ garage_id: id });
    const url = `${API_V2}/get-garage?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`[getVehicleById] HTTP ${res.status} for id=${id}`);
      return null;
    }
    const vehicle = (await res.json()) as ApiVehicle | { success: false };
    // The endpoint answers 200 with {success:false} for a missing or inactive
    // vehicle rather than a 404, so the body is what decides.
    if (!vehicle || typeof vehicle !== "object" || !("id" in vehicle)) {
      return null;
    }
    return vehicle as ApiVehicle;
  } catch (err) {
    console.error("[getVehicleById] fetch error:", err);
    return null;
  }
}

/** "2019 Porsche 911", skipping whatever is missing. */
export function vehicleTitle(vehicle: ApiVehicle): string {
  const parts = [vehicle.year, vehicle.make, vehicle.model]
    .map((p) => (p === null || p === undefined ? "" : String(p).trim()))
    .filter((p) => p.length > 0);

  return parts.length > 0 ? parts.join(" ") : "Vehicle";
}

export function formatVenueEventStart(startDate: string): string | null {
  if (!startDate || typeof startDate !== "string") return null;
  const d = new Date(startDate.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return null;

  const datePart = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d);

  const h = d.getUTCHours();
  const min = d.getUTCMinutes();
  if (h === 0 && min === 0) return datePart;

  let dh = h % 12;
  if (dh === 0) dh = 12;
  const period = h >= 12 ? "PM" : "AM";
  const timePart =
    min === 0
      ? `${dh}${period}`
      : `${dh}:${String(min).padStart(2, "0")}${period}`;
  return `${datePart} · ${timePart}`;
}

// =====================================================================
// User profile + user posts
// =====================================================================

export type ApiUserProfileLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  mivia?: string;
  custodian?: string;
  external_links?: unknown[];
};

export type ApiUser = {
  id: string | number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image?: string | { url?: string } | null;
  cover_image?: string | { url?: string } | null;
  verified?: boolean;
  /** Arrays of follower/following references — length is the count. */
  followers?: unknown[];
  following?: unknown[];
  /** May come as a numeric string from PHP. */
  posts_count?: number | string;
  profile_links?: ApiUserProfileLinks;
  email_verified?: boolean;
};

type ApiUserResponse = {
  success: boolean;
  user?: ApiUser;
  message?: string;
};

/**
 * Fetch a user profile by either numeric id or string username — auto-routed
 * to the correct query param. Skips auth; the public response has everything
 * the SEO/preview needs (followers list, profile_links, etc.).
 */
export async function getUserProfile(handle: string): Promise<ApiUser | null> {
  try {
    const params = new URLSearchParams();
    if (/^\d+$/.test(handle)) params.set("user_id", handle);
    else params.set("username", handle);

    const url = `${API_V2}/get-user-profile-next?${params.toString()}`;
    console.log(url);
    
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`[getUserProfile] HTTP ${res.status} for handle=${handle}`);
      return null;
    }
    const json = (await res.json()) as ApiUserResponse;
    if (!json?.success || !json.user) {
      console.error("[getUserProfile] unsuccessful response", json);
      return null;
    }
    return json.user;
  } catch (err) {
    console.error("[getUserProfile] fetch error:", err);
    return null;
  }
}

export type ApiUserPostMedia = {
  id: string;
  media_url: string;
  server?: string;
  media_type: "image" | "video" | string;
};

export type ApiUserPost = {
  id: string;
  caption: string;
  asc_link_type?: string | null;
  asc_link?: string | null;
  media: ApiUserPostMedia[];
};

type ApiUserPostsResponse = {
  total_pages?: number;
  page?: number;
  limit?: number;
  data?: ApiUserPost[];
};

/**
 * Fetch a user's posts. Defaults to the first 3 (matches the preview grid).
 */
export async function getUserPosts(
  userId: string | number,
  limit = 3,
): Promise<ApiUserPost[]> {
  try {
    const params = new URLSearchParams({
      user_id: String(userId),
      tagged: "0",
      page: "1",
      limit: String(limit),
    });
    const url = `${API_V2}/get-user-posts?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`[getUserPosts] HTTP ${res.status} for user_id=${userId}`);
      return [];
    }
    const json = (await res.json()) as ApiUserPostsResponse;
    return json?.data ?? [];
  } catch (err) {
    console.error("[getUserPosts] fetch error:", err);
    return [];
  }
}

// =====================================================================
// QR codes
// =====================================================================
 
export type ApiLinkedEntity = {
  linked_to: string | number;
};
 
/**
 * Resolve a physical QR code to the entity it's linked to. POST endpoint —
 * always uncached because QR-to-entity bindings can change at any moment
 * (users re-link plates, transfer ownership, etc.).
 *
 * Returns null on HTTP failure, error responses, or when the code isn't
 * linked to anything. The caller treats `null` as "send them to the landing".
 */
export async function getLinkedEntity(
  qrCode: string,
): Promise<ApiLinkedEntity | null> {
  try {
    const res = await fetch(`${API_V1}/get-linked-entity`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_code: qrCode }),
    });
    if (!res.ok) {
      console.error(`[getLinkedEntity] HTTP ${res.status} for qr=${qrCode}`);
      return null;
    }
    const json = await res.json();
    if (json?.status === 'error' || json?.error) {
      console.error('[getLinkedEntity] error response:', json?.message ?? json?.error);
      return null;
    }
    const linkedTo = json?.data?.linked_to;
    if (linkedTo == null) return null;
    return { linked_to: linkedTo };
  } catch (err) {
    console.error('[getLinkedEntity] fetch error:', err);
    return null;
  }
}

// =====================================================================
// Shared helpers
// =====================================================================

export function parseServerDate(raw: string): Date {
  return new Date(raw.replace(" ", "T") + "Z");
}

export function formatCount(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function asNumber(
  value: string | number | null | undefined,
  fallback = 0,
): number {
  if (value == null) return fallback;
  const n = typeof value === "number" ? value : parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function authorDisplayName(post: ApiPost): string {
  if (post.is_club_post || post.is_venue_post) return post.username;
  return `@${post.username}`;
}

export function htmlToPlainText(html: string, maxLen = 160): string {
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen - 1) + "…" : plain;
}

/**
 * Extract a URL from a field that may be a string, an ACF image object
 * `{ url, sizes, … }`, or null. Used for profile_image / cover_image where
 * the API isn't strict about the shape.
 */
export function extractImageUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "object" && value !== null) {
    const url = (value as { url?: unknown }).url;
    if (typeof url === "string" && url) return url;
  }
  return null;
}
