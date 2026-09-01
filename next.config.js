/** @type {import('next').NextConfig} */
// Configuration Next.js avec en-têtes de cache pour le Service Worker PWA
const nextConfig = {
  reactStrictMode: true,
  // Netlify gère le runtime Next.js via @netlify/plugin-nextjs (mode SSR standard)
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
