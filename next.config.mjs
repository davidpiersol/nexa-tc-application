/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      const mem =
        process.env.NEXA_WEBPACK_DEV_MEMORY_CACHE === "1" ||
        process.env.NEXA_WEBPACK_DEV_MEMORY_CACHE === "true";
      if (mem) {
        // Opt-in: avoids corrupted `.next/cache/webpack/*.pack.gz` restores (hasStartTime / ENOENT).
        // Default OFF — filesystem cache is much faster for day-to-day dev.
        config.cache = { type: "memory" };
      }
    }
    return config;
  },

  async redirects() {
    return [{ source: "/mfa", destination: "/auth/mfa", permanent: false }];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    /** @type {{ key: string; value: string }[]} */
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' blob: data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.postmarkapp.com",
          "frame-ancestors 'none'",
        ].join("; "),
      },
    ];
    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
