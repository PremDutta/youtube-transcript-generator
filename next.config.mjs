/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lean, self-contained build output for Docker: bundles only the files
  // node needs to run the server, not the full node_modules tree.
  output: "standalone",
  // `next dev` auto-writes AGENTS.md/CLAUDE.md (AI-agent instructions) into
  // the project root on every run — not something a public repo should ship.
  agentRules: false,
};

export default nextConfig;
