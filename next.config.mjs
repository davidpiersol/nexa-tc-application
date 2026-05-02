/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/mfa", destination: "/auth/mfa", permanent: false }];
  },
};

export default nextConfig;
