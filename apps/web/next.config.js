/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // api.ts reads NEXT_PUBLIC_GATEWAY_URL — must match exactly
    NEXT_PUBLIC_GATEWAY_URL: process.env.GATEWAY_URL ?? 'http://localhost:4000',
    NEXT_PUBLIC_WS_URL: process.env.CASINO_WS_URL ?? 'ws://localhost:3006/ws',
  },
}
module.exports = nextConfig
