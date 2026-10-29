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
  return (
    <>
      <Hero count={spots.length} />
      <Explorer
        spots={spots.map(slimSpot)}
        mapCoords={mapCoords}
        ownCoords={ownCoords as Record<string, { lat: number; lng: number }>}
        footer={<Footer />}
        overlay={<Hero count={spots.length} variant="overlay" />}
      />
    </>
  );
}
