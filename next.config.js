/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Unsplash images while deploying on Netlify without server-side image optimisation.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Netlify does not currently support the new _ipx image optimisation route.
    // Disabling optimisation prevents 404/403 errors for remote images.
    unoptimized: true,
  },
};

module.exports = nextConfig;
