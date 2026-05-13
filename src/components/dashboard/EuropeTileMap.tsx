import { useState } from "react";

// Roughly geographic tile-grid coordinates [row, col] for European countries.
// Conflict-free unique cells. Small micro-states are omitted.
const GRID: Record<string, [number, number]> = {
  Iceland: [0, 0],
  Norway: [0, 5],
  Sweden: [0, 6],
  Finland: [0, 7],

  Ireland: [1, 2],
  "United Kingdom": [1, 3],
  Denmark: [1, 5],
  Estonia: [1, 8],

  Netherlands: [2, 4],
  Germany: [2, 5],
  Poland: [2, 7],
  Latvia: [2, 8],

  France: [3, 3],
  Belgium: [3, 4],
  Luxembourg: [3, 5],
  Czechia: [3, 6],
  Slovakia: [3, 7],
  Lithuania: [3, 8],

  Portugal: [4, 2],
  Spain: [4, 3],
  Switzerland: [4, 5],
  Austria: [4, 6],
  Hungary: [4, 7],
  Ukraine: [4, 8],
  Belarus: [4, 9],

  Andorra: [5, 3],
  Italy: [5, 5],
  Slovenia: [5, 6],
  Croatia: [5, 7],
  Romania: [5, 8],
  Moldova: [5, 9],

  Malta: [6, 4],
  "Bosnia and Herzegovina": [6, 6],
  Serbia: [6, 7],
  Bulgaria: [6, 8],

  Montenegro: [7, 6],
  Albania: [7, 7],
  "North Macedonia": [7, 8],
  Türkiye: [7, 9],

  Greece: [8, 7],
  Cyprus: [8, 9],
};

// Aliases: map dataset names to canonical grid keys
const ALIAS: Record<string, string> = {
  Turkey: "Türkiye",
  "Czech Republic": "Czechia",
  "Republic of Moldova": "Moldova",
  "Russian Federation": "Russia", // not on grid; skipped
};

const ROWS = 9;
const COLS = 10;

export interface EuropeTileMapDatum {
  country: string;
  value: number | null | undefined;
}

interface EuropeTileMapProps {
  data: EuropeTileMapDatum[];
  /** Map a value to a fill color. Receives null/undefined for "no data". */
  colorFor: (value: number | null | undefined) => string;
  /** Tooltip lines for a country tile */
  tooltipLines: (d: { country: string; value: number | null | undefined }) => string[];
  /** Optional legend items rendered under the map */
  legend?: { color: string; label: string }[];
  height?: number;
}

export function EuropeTileMap({
  data,
  colorFor,
  tooltipLines,
  legend,
  height = 360,
}: EuropeTileMapProps) {
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    lines: string[];
  } | null>(null);

  // Index data by canonical country key
  const byCountry = new Map<string, number | null | undefined>();
  for (const d of data) {
    const key = ALIAS[d.country] ?? d.country;
    if (key in GRID) byCountry.set(key, d.value);
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${COLS * 10} ${ROWS * 10}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        onMouseLeave={() => setHover(null)}
      >
        {Object.entries(GRID).map(([country, [r, c]]) => {
          const value = byCountry.has(country) ? byCountry.get(country) : null;
          const fill = colorFor(value);
          return (
            <g key={country}>
              <rect
                x={c * 10 + 0.6}
                y={r * 10 + 0.6}
                width={8.8}
                height={8.8}
                rx={1.2}
                fill={fill}
                stroke="#fff"
                strokeWidth={0.4}
                style={{ cursor: "pointer", transition: "opacity 120ms" }}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  const containerRect = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect();
                  setHover({
                    x: ((c + 0.5) * 10 / (COLS * 10)) * rect.width + (rect.left - containerRect.left),
                    y: ((r + 0.5) * 10 / (ROWS * 10)) * rect.height + (rect.top - containerRect.top),
                    lines: tooltipLines({ country, value }),
                  });
                }}
              />
              <text
                x={c * 10 + 5}
                y={r * 10 + 6.4}
                textAnchor="middle"
                fontSize={2.6}
                fontWeight={600}
                fill={isLight(fill) ? "#1a1432" : "#ffffff"}
                pointerEvents="none"
                style={{ userSelect: "none" }}
              >
                {ISO[country] ?? country.slice(0, 2).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-xl"
          style={{
            left: hover.x,
            top: hover.y,
            transform: "translate(-50%, -110%)",
            whiteSpace: "nowrap",
          }}
        >
          {hover.lines.map((line, i) => (
            <div key={i} className={i === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
              {line}
            </div>
          ))}
        </div>
      )}

      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block size-3 rounded-sm border border-black/10" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Country → ISO 2-letter code (for tile labels)
const ISO: Record<string, string> = {
  Iceland: "IS", Norway: "NO", Sweden: "SE", Finland: "FI",
  Ireland: "IE", "United Kingdom": "UK", Denmark: "DK", Estonia: "EE",
  Netherlands: "NL", Germany: "DE", Poland: "PL", Latvia: "LV",
  France: "FR", Belgium: "BE", Luxembourg: "LU", Czechia: "CZ",
  Slovakia: "SK", Lithuania: "LT",
  Portugal: "PT", Spain: "ES", Switzerland: "CH", Austria: "AT",
  Hungary: "HU", Ukraine: "UA", Belarus: "BY",
  Andorra: "AD", Italy: "IT", Slovenia: "SI", Croatia: "HR",
  Romania: "RO", Moldova: "MD",
  Malta: "MT", "Bosnia and Herzegovina": "BA", Serbia: "RS", Bulgaria: "BG",
  Montenegro: "ME", Albania: "AL", "North Macedonia": "MK", Türkiye: "TR",
  Greece: "GR", Cyprus: "CY",
};

// Approximate luminance check to pick text color
function isLight(hex: string): boolean {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62;
}
