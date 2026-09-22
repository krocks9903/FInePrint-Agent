/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@fineprint/shared",
    "@fineprint/agent",
    "@fineprint/mcp-document",
  ],
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
