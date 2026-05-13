// Decorative SVG composition for the ELMS Home hero.
// Layers (back -> front): soft chart grid, Europe map silhouette, EU star ring,
// abstract chart lines/bars, city skyline silhouette.
// Inspired by the uploaded reference, recreated in palette tokens.

export function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {/* Soft radial wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 80% 10%, rgba(33,56,133,0.10) 0%, rgba(33,56,133,0) 55%), radial-gradient(80% 60% at 10% 90%, rgba(137,49,114,0.08) 0%, rgba(137,49,114,0) 60%)",
        }}
      />

      <svg
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#213885" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#5F3475" stopOpacity="0.10" />
          </linearGradient>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#081849" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#081849" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#893172" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#893172" stopOpacity="0" />
          </linearGradient>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="#213885"
              strokeOpacity="0.06"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Background grid */}
        <rect width="1200" height="720" fill="url(#grid)" />

        {/* Europe-inspired silhouette (stylised, not geographically literal) */}
        <g transform="translate(680,90)" opacity="0.9">
          <path
            d="M120,40 C160,20 220,30 260,55 C300,40 340,55 350,90 C385,100 400,135 380,160
               C420,170 430,210 400,235 C420,270 390,300 355,295 C345,330 305,345 275,330
               C260,365 215,375 185,355 C155,380 110,375 90,345 C55,355 20,330 25,295
               C-5,285 -10,245 20,225 C-5,200 5,160 40,150 C25,115 60,85 100,90 C100,65 105,50 120,40 Z"
            fill="url(#mapGrad)"
            stroke="#213885"
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />
          {/* Scandinavia-ish appendage */}
          <path
            d="M250,30 C265,5 290,0 295,25 C305,45 285,70 270,65 Z"
            fill="url(#mapGrad)"
            stroke="#213885"
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />
          {/* British isles dots */}
          <circle cx="55" cy="120" r="14" fill="#213885" fillOpacity="0.12" stroke="#213885" strokeOpacity="0.3" />
          <circle cx="35" cy="155" r="6" fill="#213885" fillOpacity="0.12" stroke="#213885" strokeOpacity="0.3" />
        </g>

        {/* EU-style star ring */}
        <g transform="translate(990,180)" opacity="0.55">
          <StarRing radius={70} />
        </g>

        {/* Abstract chart area (left mid) */}
        <g transform="translate(60,360)" opacity="0.85">
          <path
            d="M0,140 L60,110 L120,125 L180,80 L240,95 L300,55 L360,70 L420,30 L420,180 L0,180 Z"
            fill="url(#chartArea)"
          />
          <path
            d="M0,140 L60,110 L120,125 L180,80 L240,95 L300,55 L360,70 L420,30"
            fill="none"
            stroke="#893172"
            strokeOpacity="0.7"
            strokeWidth="2"
          />
          {/* Mini bars below */}
          {Array.from({ length: 14 }).map((_, i) => (
            <rect
              key={i}
              x={i * 30}
              y={210 - (8 + ((i * 13) % 36))}
              width="14"
              height={8 + ((i * 13) % 36)}
              fill="#213885"
              fillOpacity={0.18 + ((i % 4) * 0.05)}
            />
          ))}
        </g>

        {/* Dotted scatter top-left */}
        <g opacity="0.5">
          {Array.from({ length: 26 }).map((_, i) => {
            const x = 80 + ((i * 53) % 520);
            const y = 60 + ((i * 37) % 180);
            return <circle key={i} cx={x} cy={y} r={2} fill="#5F3475" />;
          })}
        </g>

        {/* European skyline silhouette along the bottom */}
        <g transform="translate(0,520)">
          <path d="M0,200 L1200,200 L1200,90 L0,90 Z" fill="url(#skyGrad)" opacity="0.0" />
          <Skyline />
        </g>
      </svg>
    </div>
  );
}

function StarRing({ radius }: { radius: number }) {
  const stars = Array.from({ length: 12 }).map((_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  });
  return (
    <g>
      <circle r={radius + 18} fill="none" stroke="#213885" strokeOpacity="0.25" strokeDasharray="2 6" />
      {stars.map((s, i) => (
        <Star key={i} x={s.x} y={s.y} size={9} />
      ))}
    </g>
  );
}

function Star({ x, y, size }: { x: number; y: number; size: number }) {
  // 5-point star path
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size / 2.4;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    points.push(`${x + Math.cos(a) * r},${y + Math.sin(a) * r}`);
  }
  return <polygon points={points.join(" ")} fill="#213885" fillOpacity="0.7" />;
}

function Skyline() {
  // Stylised silhouettes: Eiffel-like, dome, clock tower, classical columns, modern towers.
  return (
    <g fill="url(#skyGrad)">
      {/* Base ground line */}
      <rect x="0" y="180" width="1200" height="20" fill="#081849" fillOpacity="0.55" />

      {/* Generic block buildings spread across */}
      {Array.from({ length: 22 }).map((_, i) => {
        const w = 28 + ((i * 17) % 30);
        const h = 40 + ((i * 31) % 90);
        const x = i * 56;
        return <rect key={i} x={x} y={180 - h} width={w} height={h} fill="#081849" fillOpacity="0.5" />;
      })}

      {/* Eiffel-like tower */}
      <g transform="translate(180,40)">
        <polygon points="30,140 0,140 12,40 18,40" fill="#081849" fillOpacity="0.8" />
        <polygon points="15,40 9,12 21,12" fill="#081849" fillOpacity="0.8" />
        <rect x="13" y="0" width="4" height="14" fill="#081849" fillOpacity="0.8" />
      </g>

      {/* Dome (St Paul's / Brussels feel) */}
      <g transform="translate(420,70)">
        <rect x="0" y="60" width="120" height="50" fill="#081849" fillOpacity="0.75" />
        <path d="M20,60 Q60,0 100,60 Z" fill="#081849" fillOpacity="0.85" />
        <rect x="56" y="-20" width="8" height="22" fill="#081849" fillOpacity="0.85" />
      </g>

      {/* Clock tower (Big Ben feel) */}
      <g transform="translate(640,30)">
        <rect x="0" y="40" width="26" height="120" fill="#081849" fillOpacity="0.8" />
        <polygon points="0,40 26,40 13,10" fill="#081849" fillOpacity="0.85" />
        <circle cx="13" cy="70" r="6" fill="#ECDFD2" fillOpacity="0.35" />
      </g>

      {/* Classical columns (Parthenon feel) */}
      <g transform="translate(800,100)">
        <rect x="0" y="60" width="140" height="6" fill="#081849" fillOpacity="0.85" />
        {Array.from({ length: 7 }).map((_, i) => (
          <rect key={i} x={6 + i * 20} y="20" width="10" height="40" fill="#081849" fillOpacity="0.8" />
        ))}
        <polygon points="0,20 140,20 70,0" fill="#081849" fillOpacity="0.85" />
      </g>

      {/* Modern towers */}
      <g transform="translate(1020,20)">
        <rect x="0" y="60" width="22" height="120" fill="#081849" fillOpacity="0.8" />
        <rect x="30" y="30" width="28" height="150" fill="#081849" fillOpacity="0.85" />
        <polygon points="30,30 58,30 44,8" fill="#081849" fillOpacity="0.85" />
        <rect x="68" y="70" width="20" height="110" fill="#081849" fillOpacity="0.78" />
      </g>
    </g>
  );
}
