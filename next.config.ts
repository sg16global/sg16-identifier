import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // On Cloudflare Workers, `pg` opens its TCP connection through pg-cloudflare,
  // which ships its real code only under the "workerd" export condition. Listing
  // both here makes the OpenNext build copy them whole instead of the Node-only
  // files Next traces. No effect on the Node server.
  serverExternalPackages: ["pg", "pg-cloudflare"],
};

export default nextConfig;
