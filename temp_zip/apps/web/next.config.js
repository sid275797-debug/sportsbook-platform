/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.GATEWAY_URL ?? 'http://localhost:4000',
    NEXT_PUBLIC_WS_URL: process.env.CASINO_WS_URL ?? 'ws://localhost:3006/ws',
  },
}
module.exports = nextConfig
