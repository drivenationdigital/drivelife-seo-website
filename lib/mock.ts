// Mock data mirroring the eventual shape of /wp-json/app/v2/get-post.
// Replace `getMockPost` with a real fetch once the API contract is wired up.

export type Author = {
  id: number;
  name: string;
  handle: string;
  avatarUrl: string;
  verified?: boolean;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // plain text or HTML
  coverImage: {
    url: string;
    alt: string;
    width: number;
    height: number;
  };
  author: Author;
  publishedAt: string; // ISO
  location?: string;
  tags: string[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
};

const MOCK_POSTS: Record<string, Post> = {
  'caffeine-and-machine-sunday': {
    id: 'p_8472',
    slug: 'caffeine-and-machine-sunday',
    title: 'Caffeine & Machine: a Sunday with Senna',
    excerpt:
      "Pulled into C&M at 8am sharp. The lineup didn't disappoint — three GT3s, an Aventador SVJ, and a Senna in Victory Grey that stole the morning.",
    content:
      "There's a particular hush at Caffeine & Machine before the engines arrive. Mist drifting across the Warwickshire fields, a kettle going somewhere inside, the smell of fresh espresso bleeding out into the car park. Then, at 7:53am, the first V12 fires.\n\nWhat followed was three hours of slow walks around some of the rarest metal in the UK. A Senna in Victory Grey. A Speedtail tucked between two GT3 RSs. A 992 ST that may or may not be the most beautiful 911 ever built — I'm not taking questions on this.\n\nThis is a small taste. The full thread, the comments from the owners, and the rest of the photo set are inside the app.",
    coverImage: {
      url: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=1600&q=80',
      alt: 'Yellow McLaren Senna parked outside Caffeine & Machine at sunrise',
      width: 1600,
      height: 1067,
    },
    author: {
      id: 42,
      name: 'Kesh Nair',
      handle: 'kesh_xn',
      avatarUrl:
        'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80',
      verified: true,
    },
    publishedAt: '2026-05-10T08:32:00.000Z',
    location: 'Stratford-upon-Avon, UK',
    tags: ['Caffeine & Machine', 'McLaren Senna', 'Sunday Run', 'Warwickshire'],
    stats: {
      likes: 1247,
      comments: 89,
      shares: 42,
    },
  },
};

export async function getMockPost(slug: string): Promise<Post | null> {
  // Default fallback: if the slug isn't found, return the canonical sample
  // so any URL renders something during development.
  return MOCK_POSTS[slug] ?? MOCK_POSTS['caffeine-and-machine-sunday'];
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}
