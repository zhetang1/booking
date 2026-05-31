import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";

// The real backyard photos from the flyer. Drop the files into /public with
// these base names (any of the listed extensions) and they appear automatically.
// Until then, this section renders nothing — no broken images.
const PHOTOS = [
  { base: "pool1", alt: "Natalie's big private backyard pool, surrounded by trees" },
  { base: "pool-jump", alt: "Kids having fun jumping into the backyard pool on a sunny day" },
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {photos.map((p) => (
          <div
            key={p.base}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200"
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
