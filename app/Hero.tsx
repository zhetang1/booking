// Marketing hero — recreates the flyer's look (deep blue, yellow display type,
// playful swimmer illustration) with the updated details the owner provided.
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#3a5ba8] text-white">
      {/* decorative bubbles */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-[#4a6fc0]" />
        <div className="absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-[#33509a]" />
        <div className="absolute right-1/3 top-1/2 h-24 w-24 rounded-full bg-[#4a6fc0]" />
      </div>

      <div className="relative mx-auto grid max-w-5xl gap-8 px-6 py-14 md:grid-cols-2 md:items-center md:py-20">
        <div>
          <h1 className="font-black uppercase leading-[0.9] tracking-tight text-[#f2e85c] drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)]">
            <span className="block text-5xl md:text-6xl">Swimming</span>
            <span className="block text-5xl md:text-6xl">Lessons</span>
          </h1>
          <p className="mt-4 max-w-md text-lg font-medium text-white/95">
            Learn to swim with confidence and safety — private lessons in a big
            backyard pool with Natalie.
          </p>

          <ul className="mt-6 space-y-2 text-white/95">
            {[
              "Red Cross Lifeguard & CPR Certified",
              "4 years of experience as a swim instructor",
              "Recent high school grad — heading to USC 🎓",
              "BIG private pool (50 ft × 25 ft)",
              "Flexible half-hour sessions",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 text-[#f2e85c]">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#book"
              className="rounded-full bg-[#f2e85c] px-6 py-3 font-bold text-[#22356b] shadow-md transition hover:brightness-105"
            >
              Book a lesson →
            </a>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
              📍 Glen Rock, NJ
            </span>
          </div>
        </div>

        {/* Illustration + price badge */}
        <div className="relative">
          <div className="mx-auto flex max-w-sm items-center justify-center rounded-3xl bg-[#4a6fc0]/60 p-8">
            <Swimmers />
          </div>
          <div className="mx-auto mt-5 w-fit rounded-2xl bg-white px-6 py-4 text-center text-[#22356b] shadow-lg">
            <div className="text-3xl font-black">$60</div>
            <div className="text-sm font-semibold">per half-hour lesson</div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              Cash or Venmo
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Swimmers() {
  return (
    <svg viewBox="0 0 200 160" className="w-full" aria-hidden="true">
      <ellipse cx="100" cy="120" rx="92" ry="30" fill="#6f93d6" opacity="0.7" />
      {/* swimmer 1 */}
      <circle cx="70" cy="70" r="14" fill="#ffd9a0" />
      <rect x="58" y="84" width="24" height="30" rx="10" fill="#e94f8a" />
      <line x1="58" y1="60" x2="42" y2="48" stroke="#ffd9a0" strokeWidth="7" strokeLinecap="round" />
      <line x1="82" y1="60" x2="98" y2="48" stroke="#ffd9a0" strokeWidth="7" strokeLinecap="round" />
      <path d="M55 64 q15 -10 30 0" stroke="#ff9d3d" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* swimmer 2 */}
      <circle cx="135" cy="60" r="13" fill="#ffd9a0" />
      <rect x="124" y="73" width="22" height="28" rx="9" fill="#e94f8a" />
      <line x1="124" y1="52" x2="110" y2="40" stroke="#ffd9a0" strokeWidth="6" strokeLinecap="round" />
      <line x1="146" y1="52" x2="160" y2="40" stroke="#ffd9a0" strokeWidth="6" strokeLinecap="round" />
      <path d="M123 54 q12 -9 24 0" stroke="#ff9d3d" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* splashes */}
      <circle cx="100" cy="110" r="4" fill="#fff" opacity="0.8" />
      <circle cx="115" cy="118" r="3" fill="#fff" opacity="0.8" />
      <circle cx="85" cy="120" r="3" fill="#fff" opacity="0.8" />
    </svg>
  );
}
