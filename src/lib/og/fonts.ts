import "server-only";

// next/og needs TTF/OTF, and full Noto Sans SC is too big, so fetch a subset with exactly the characters used (SPEC §6.9).
const cache = new Map<string, Promise<ArrayBuffer>>();

export function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const chars = [...new Set(text)].sort().join("");
  const key = `${family}:${weight}:${chars}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(chars)}`;
      // Without a modern UA, Google Fonts serves TTF, which is what satori needs.
      const css = await (await fetch(url)).text();
      const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
      if (!src) throw new Error(`font subset not found for ${family}`);
      return (await fetch(src)).arrayBuffer();
    })();
    cache.set(key, p);
  }
  return p;
}
