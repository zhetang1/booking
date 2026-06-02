import Link from "next/link";
import Image from "next/image";
import Hero from "./Hero";
import BookingClient from "./BookingClient";

const PHOTOS = [
  { src: "/IMG_1.jpg", alt: "Backyard pool with flowers in bloom" },
  { src: "/IMG_2.jpg", alt: "Poolside patio with umbrella and hydrangeas" },
  { src: "/IMG_3.jpg", alt: "Garden irises beside the pool" },
];

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />

      {/* About */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900">Meet Natalie</h2>
        <p className="mt-3 leading-relaxed text-slate-600">
          Natalie is a Red Cross certified lifeguard who has spent the last few
          summers teaching swimmers of all ages. A recent
          high school graduate heading to USC, she brings{" "}
          <strong>4 years of experience </strong> as a swim instructor to private
          lessons in her family&apos;s big backyard pool. Whether your swimmer is
          just getting comfortable in the water or working on their strokes,
          Natalie will help them learn to swim with confidence and safety.
        </p>
      </section>

      {/* Pool photos */}
      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {PHOTOS.map((p) => (
            <div
              key={p.src}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Booking */}
      <section id="book" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-slate-900">Book a lesson</h2>
          <p className="mt-2 text-slate-600">
            Pick one or more open times below. Paid in cash or Venmo at the lesson.
          </p>
          <div className="mt-6">
            <BookingClient />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-500">
        <p>📍 Glen Rock, NJ · Private backyard pool</p>
        <p className="mt-1">
          <Link href="/admin" className="hover:text-slate-700 hover:underline">
            Admin login
          </Link>
        </p>
      </footer>
    </main>
  );
}
