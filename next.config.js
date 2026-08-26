const { PHASE_PRODUCTION_SERVER } = require('next/constants');

/**
 * Security headers applied to every response.
 *
 * HSTS is deliberately NOT set here — it belongs on the TLS-terminating proxy
 * (nginx), so it stays aligned with certificate renewal and is not duplicated.
 *
 * The CSP allows 'unsafe-inline' for scripts because Next 14's inline
 * bootstrap requires it; a nonce-based policy needs middleware nonce plumbing
 * and is deferred. There are no third-party scripts in this application, and
 * frame-ancestors 'none' plus nosniff cover the practical risks.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build output directory. Overridable so a production build can run without
  // fighting a `next dev` server in the same folder — they share .next and
  // corrupt each other's output, which shows up as intermittent 500s.
  distDir: process.env.AQAR_DIST_DIR || '.next',
  // Produces <distDir>/standalone — a self-contained server bundle, which is
  // what the Dockerfile ships.
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'exceljs', 'docx'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = (phase) => {
  // Fail loudly at boot rather than serving with a forgeable session key.
  // Checked only when actually starting the production server: `next build`
  // runs inside Docker without secrets and must still succeed.
  if (phase === PHASE_PRODUCTION_SERVER) {
    const secret = process.env.AQAR_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        'AQAR_SECRET is not set (or is shorter than 32 characters). ' +
          'Refusing to start. Generate one with: ' +
          'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))" ' +
          '— see docs/RUNBOOK.md.'
      );
    }
  }
  return nextConfig;
};
