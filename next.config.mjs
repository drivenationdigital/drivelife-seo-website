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
    ],
  },
};

export default nextConfig;
