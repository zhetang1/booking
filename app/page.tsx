import Link from "next/link";
import Hero from "./Hero";
import Gallery from "./Gallery";
import BookingClient from "./BookingClient";

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

      {/* Backyard pool photos (renders when the files exist in /public) */}
      <Gallery />

      {/* Booking */}
      <section id="book" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-6">
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
