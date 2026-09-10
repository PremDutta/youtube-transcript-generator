/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next dev` auto-writes AGENTS.md/CLAUDE.md (AI-agent instructions) into
  // the project root on every run — not something a public repo should ship.
  agentRules: false,
};

export default nextConfig;
