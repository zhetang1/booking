// Marketing hero — recreates the flyer's look (deep blue, yellow display type,
// playful swimmer illustration) with the updated details the admin provided.
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#3a5ba8] text-white">
      {/* decorative bubbles scattered around the hero */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-[#4a6fc0]" />
        <div className="absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-[#33509a]" />
        <div className="absolute right-1/3 top-1/2 h-24 w-24 rounded-full bg-[#4a6fc0]" />
        <div className="absolute -right-12 bottom-6 h-48 w-48 rounded-full bg-[#5a7fd0]" />
        <div className="absolute left-1/4 -top-8 h-28 w-28 rounded-full bg-[#5a7fd0]" />
        <div className="absolute left-6 top-1/3 h-16 w-16 rounded-full bg-[#4a6fc0]" />
        <div className="absolute right-1/4 bottom-4 h-12 w-12 rounded-full bg-[#33509a]" />
        <div className="absolute left-1/2 bottom-12 h-20 w-20 rounded-full bg-[#4a6fc0]" />
        <div className="absolute right-20 top-1/2 h-10 w-10 rounded-full bg-[#5a7fd0]" />
        <div className="absolute left-12 bottom-1/3 h-8 w-8 rounded-full bg-[#5a7fd0]" />
      </div>

      <div className="relative mx-auto grid max-w-5xl gap-8 px-6 py-14 md:grid-cols-2 md:items-center md:py-20">
        <div>
          <h1 className="font-black uppercase leading-[0.9] tracking-tight text-[#f2e85c] drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)]">
            <span className="block text-5xl md:text-6xl">Private Swimming Lessons</span>
          </h1>
          <p className="mt-4 max-w-md text-lg font-medium text-white/95">
            Learn to swim with confidence and safety — private lessons in a big
            backyard pool with Natalie.
          </p>

          <ul className="mt-6 space-y-2 text-white/95">
            {[
              "Red Cross Lifeguard & CPR Certified",
              "4 years of experience as a swim instructor",
              "Recent The Lawrenceville High School grad — heading to USC 🎓",
              "BIG private pool (50 ft × 25 ft)",
              "Flexible half-hour sessions",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 text-[#f2e85c]">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Illustration + call-to-action */}
        <div className="relative">
          <div className="mx-auto flex max-w-sm items-center justify-center">
            <Swimmers />
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#book"
              className="rounded-full bg-[#f2e85c] px-6 py-3 font-bold text-[#22356b] shadow-md transition hover:brightness-105"
            >
              Book a lesson →
            </a>
            <a
              href="tel:+12019573751"
              className="rounded-full bg-white/15 px-6 py-3 font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
            >
              📞 Text (201) 957-3751
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Hand-drawn, flyer-style doodle: two kids in a soft blue water blob, with white
// ripple linework and scattered splash droplets. One has ginger hair, one black.
const SKIN = "#ffd3a1";
const HAIR = "#f0913c";
const HAIR_DARK = "#2b2832";
const SUIT = "#ee5391";
const INK = "#33271b";
const WATER = "#5478c4";
const WATER_FRONT = "#4a6cb4";
const FOAM = "#eef5ff";

function Swimmers() {
  return (
    <svg
      viewBox="0 0 240 200"
      className="w-full"
      role="img"
      aria-label="Two children happily swimming in a pool"
    >
      <defs>
        <clipPath id="blob">
          <path d="M22 78 C18 50 52 40 108 42 C168 44 224 40 226 82 C230 122 222 168 150 172 C92 176 30 172 20 132 C14 108 26 96 22 78 Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#blob)">
        {/* water */}
        <rect x="0" y="0" width="240" height="200" fill={WATER} />

        {/* swimmers (lower bodies hidden by the front water band) */}
        <BackSwimmer />
        <FrontSwimmer />

        {/* front water band with a wavy top → kids look waist-deep */}
        <path
          d="M6 112 q24 -11 48 0 t48 0 t48 0 t48 0 t48 0 L246 200 L6 200 Z"
          fill={WATER_FRONT}
        />

        {/* white ripple linework on the surface */}
        <g fill="none" stroke={FOAM} strokeLinecap="round">
          <path d="M8 112 q24 -11 48 0 t48 0 t48 0 t48 0 t48 0" strokeWidth="2.4" opacity="0.9" />
          {/* around the front swimmer */}
          <path d="M64 118 q34 14 70 0" strokeWidth="2" opacity="0.85" />
          <path d="M72 126 q26 11 54 0" strokeWidth="1.6" opacity="0.55" />
          {/* around the back swimmer */}
          <path d="M126 110 q28 11 58 0" strokeWidth="2" opacity="0.8" />
          <path d="M132 116 q22 9 46 0" strokeWidth="1.5" opacity="0.5" />
          {/* loose free ripples */}
          <path d="M40 138 q11 6 22 0" strokeWidth="1.5" opacity="0.55" />
          <path d="M176 134 q12 6 24 0" strokeWidth="1.5" opacity="0.55" />
          <path d="M150 150 q12 6 24 0" strokeWidth="1.4" opacity="0.45" />
        </g>
      </g>

      {/* splash droplets (drawn over everything, can spill past the blob) */}
      <g fill={FOAM}>
        {/* cluster to the upper-left, like the flyer */}
        <Drop x={50} y={70} s={1.1} />
        <Drop x={44} y={84} s={0.8} />
        <Drop x={56} y={92} s={0.9} />
        <Drop x={40} y={100} s={0.7} />
        {/* flying off the raised hands */}
        <Drop x={150} y={40} s={1} />
        <Drop x={160} y={32} s={0.7} />
        <Drop x={196} y={52} s={0.9} />
        <Drop x={204} y={64} s={0.7} />
        <Drop x={128} y={52} s={0.8} />
        {/* a few small splashes near the water */}
        <circle cx="92" cy="150" r="2.4" />
        <circle cx="110" cy="158" r="1.8" />
        <circle cx="170" cy="156" r="2" />
      </g>
    </svg>
  );
}

// A soft white water droplet (rounded teardrop), scaled by `s`.
function Drop({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <ellipse cx={x} cy={y} rx={3.2 * s} ry={4.4 * s} opacity="0.92" />
  );
}

// Front kid: long flowing ginger hair, one arm waving.
function FrontSwimmer() {
  return (
    <g transform="translate(98 102)">
      {/* long hair behind, flowing into the water */}
      <ellipse cx="0" cy="-20" rx="15" ry="16" fill={HAIR} />
      <path d="M-13 -10 q-5 24 -3 48" fill="none" stroke={HAIR} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M13 -10 q5 24 3 48" fill="none" stroke={HAIR} strokeWidth="4.5" strokeLinecap="round" />

      {/* torso + pink swimsuit */}
      <path d="M-12 -6 Q0 -11 12 -6 L11 34 Q0 39 -11 34 Z" fill={SUIT} stroke={INK} strokeWidth="1" />

      {/* arms */}
      <path d="M-11 -2 Q-23 -1 -31 7" fill="none" stroke={SKIN} strokeWidth="7.5" strokeLinecap="round" />
      <path d="M11 -3 Q25 -14 31 -40" fill="none" stroke={SKIN} strokeWidth="7.5" strokeLinecap="round" />

      {/* head */}
      <circle cx="0" cy="-19" r="14" fill={SKIN} />
      {/* fringe */}
      <path d="M-14 -21 Q-14 -35 0 -35 Q14 -35 14 -21 Q7 -29 0 -28 Q-7 -29 -14 -21 Z" fill={HAIR} />

      {/* face */}
      <circle cx="-5.5" cy="-19" r="1.9" fill={INK} />
      <circle cx="5.5" cy="-19" r="1.9" fill={INK} />
      <path d="M-5 -12 Q0 -7 5 -12" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="-9" cy="-14" r="2.3" fill="#ff9a9a" opacity="0.55" />
      <circle cx="9" cy="-14" r="2.3" fill="#ff9a9a" opacity="0.55" />
    </g>
  );
}

// Back kid: ginger top-bun, both arms raised.
function BackSwimmer() {
  return (
    <g transform="translate(152 92) scale(0.9)">
      {/* hair + bun */}
      <ellipse cx="0" cy="-17" rx="15" ry="16" fill={HAIR_DARK} />
      <circle cx="0" cy="-33" r="7" fill={HAIR_DARK} />

      {/* torso + pink swimsuit */}
      <path d="M-11 -5 Q0 -10 11 -5 L10 32 Q0 37 -10 32 Z" fill={SUIT} stroke={INK} strokeWidth="1" />

      {/* both arms raised */}
      <path d="M-9 -3 Q-19 -18 -23 -36" fill="none" stroke={SKIN} strokeWidth="7" strokeLinecap="round" />
      <path d="M9 -3 Q19 -18 23 -36" fill="none" stroke={SKIN} strokeWidth="7" strokeLinecap="round" />

      {/* head */}
      <circle cx="0" cy="-17" r="12.5" fill={SKIN} />
      <path d="M-12 -19 Q-12 -31 0 -31 Q12 -31 12 -19 Q6 -26 0 -25 Q-6 -26 -12 -19 Z" fill={HAIR_DARK} />

      {/* face */}
      <circle cx="-4.8" cy="-17" r="1.7" fill={INK} />
      <circle cx="4.8" cy="-17" r="1.7" fill={INK} />
      <path d="M-4.4 -10 Q0 -6 4.4 -10" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="-8" cy="-12" r="2" fill="#ff9a9a" opacity="0.55" />
      <circle cx="8" cy="-12" r="2" fill="#ff9a9a" opacity="0.55" />
    </g>
  );
}
