"use client";
import NextError from "next/error";

// Requests outside any locale (rare; proxy redirects most). Locale-aware 404 is [locale]/not-found.tsx.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <NextError statusCode={404} />
      </body>
    </html>
  );
}
