import { setRequestLocale } from "next-intl/server";
import { Explorer } from "@/components/Explorer";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { getVisibleSpots, getMapCoords } from "@/lib/spots";
import { slimSpot } from "@/lib/client-spot";
import ownCoords from "@/data/address-geo.json";

export const revalidate = 86400;

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const spots = await getVisibleSpots();
  const mapCoords = await getMapCoords(spots);
  // Desktop: the intro bar and the list/map share one screen-height column, so the map (and its zoom buttons and
  // Google attribution) never runs below the fold while the bar is showing.
  return (
    <div className="flex flex-1 flex-col lg:h-[calc(100dvh-3.5rem)] lg:flex-none">
      <Hero count={spots.length} />
      <Explorer
        spots={spots.map(slimSpot)}
        mapCoords={mapCoords}
        ownCoords={ownCoords as Record<string, { lat: number; lng: number }>}
        footer={<Footer />}
        overlay={<Hero count={spots.length} variant="overlay" />}
      />
    </div>
  );
}
