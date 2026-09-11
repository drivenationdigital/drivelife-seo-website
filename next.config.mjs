/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Post media + avatars (Cloudflare Images)
      { protocol: 'https', hostname: 'imagedelivery.net' },
      // WordPress media (in case the API returns wp-uploaded files)
      { protocol: 'https', hostname: 'www.carevents.com' },
      { protocol: 'https', hostname: 'carevents.com' },
      // Gravatar fallback
      { protocol: 'https', hostname: 'secure.gravatar.com' },
      // Video stills (Cloudflare Stream). A video post's thumbnail is
      // customer-<code>.cloudflarestream.com/<id>/thumbnails/thumbnail.jpg;
      // without this the optimiser refuses it and the tile is broken anyway.
      // Scoped to the thumbnail path so it cannot be used to proxy anything
      // else off those hosts.
      {
        protocol: 'https',
        hostname: '**.cloudflarestream.com',
        pathname: '/*/thumbnails/**',
      },
      {
        protocol: 'https',
        hostname: 'videodelivery.net',
        pathname: '/*/thumbnails/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/user/:username',
        destination: '/profile/:username',
        permanent: true,
      },
    ];
  }
};

export default nextConfig;
