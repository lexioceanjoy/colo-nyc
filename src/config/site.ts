// Rename the product here (SPEC §13).
export const site = {
  name: "Colo NYC",
  nameZh: "纽约同城办公地图",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://colo-nyc.vercel.app",
  repo: "https://github.com/lexioceanjoy/colo-nyc",
  ownerName: "Lexi",
  mapCenter: { lat: 40.7268, lng: -73.9696 },
} as const;
