import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";

// The real backyard photos from the flyer. Drop the files into /public with
// these base names (any of the listed extensions) and they appear automatically.
// Until then, this section renders nothing — no broken images.
const PHOTOS = [
  { base: "pool1", alt: "Natalie's big private backyard pool, surrounded by trees" },
];

const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function resolvePhoto(base: string): string | null {
  for (const ext of EXTENSIONS) {
    const file = `${base}.${ext}`;
    if (existsSync(path.join(process.cwd(), "public", file))) {
      return `/${file}`;
    }
  }
  return null;
}

export default function Gallery() {
  const photos = PHOTOS.map((p) => ({ ...p, src: resolvePhoto(p.base) })).filter(
    (p): p is { base: string; alt: string; src: string } => p.src !== null
  );

  if (photos.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h2 className="text-2xl font-bold text-slate-900">Take a peek at the pool</h2>
      <p className="mt-2 text-slate-600">
        Lessons happen right here in our big private backyard pool in Glen Rock.
      </p>
      <div
        className={`mt-6 grid gap-4 ${
          photos.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-2xl"
        }`}
      >
        {photos.map((p) => (
          <div
            key={p.base}
            className={`relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200 ${
              photos.length > 1 ? "aspect-[4/3]" : "aspect-[3/4]"
            }`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes={
                photos.length > 1
                  ? "(min-width: 640px) 50vw, 100vw"
                  : "(min-width: 640px) 42rem, 100vw"
              }
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
