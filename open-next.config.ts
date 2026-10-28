import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page and API route is force-dynamic, so there is no ISR/SSG output to
// keep and no incremental cache (R2/KV) is configured.
export default defineCloudflareConfig({});
