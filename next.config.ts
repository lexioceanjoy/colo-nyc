import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Classic ISR model (revalidate + generateStaticParams + setRequestLocale), per SPEC §3. See DECISIONS.md.
  cacheComponents: false,
  // Tailwind output is small (~8 KiB), so inline it: removes the one render-blocking stylesheet (PSI: ~520 ms).
  experimental: { inlineCss: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
