import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

let fontCache: { display: ArrayBuffer; mono: ArrayBuffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const dir = path.join(process.cwd(), "src", "styles");
  const [display, mono] = await Promise.all([
    readFile(path.join(dir, "manrope-latin-700.woff")),
    readFile(path.join(dir, "jetbrains-mono-latin-400.woff")),
  ]);
  fontCache = { display: toArrayBuffer(display), mono: toArrayBuffer(mono) };
  return fontCache;
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

interface OgProps {
  eyebrow: string;
  title: string;
  description?: string;
  footer?: string;
}

/**
 * Branded Open Graph template used by every opengraph-image route. Satori
 * requires TTF/OTF/WOFF (not woff2), so static WOFF cuts of the brand fonts are
 * kept in src/styles for this purpose only. Falls back to system fonts if loading fails.
 */
export async function renderOg({ eyebrow, title, description, footer = "celestinoenterprise.com" }: OgProps) {
  let fonts: { name: string; data: ArrayBuffer; weight: 400 | 600 | 700 }[] = [];
  try {
    const f = await loadFonts();
    fonts = [
      { name: "Manrope", data: f.display, weight: 700 },
      { name: "JetBrains Mono", data: f.mono, weight: 400 },
    ];
  } catch {
    fonts = [];
  }
  const displayFont = fonts.length ? "Manrope" : "sans-serif";
  const monoFont = fonts.length ? "JetBrains Mono" : "monospace";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#0a0e13",
          color: "#eef2f6",
          fontFamily: displayFont,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="40" height="40" viewBox="0 0 32 32">
              <path d="M16 2.5 4.5 6.8v8.4c0 6.7 4.7 12.5 11.5 14.3 6.8-1.8 11.5-7.6 11.5-14.3V6.8L16 2.5Z" fill="#1a2430" stroke="#3d9bff" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9.5 12.2 16 9.6l6.5 2.6L16 14.8l-6.5-2.6Z" fill="#3d9bff" />
              <path d="m9.5 16.4 6.5 2.6 6.5-2.6" fill="none" stroke="#3d9bff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m9.5 20.6 6.5 2.6 6.5-2.6" fill="none" stroke="#3d9bff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
              Celestino <span style={{ color: "#b3bdc8", fontWeight: 400, marginLeft: 8 }}>Enterprise</span>
            </div>
          </div>
          <div style={{ display: "flex", fontFamily: monoFont, fontSize: 18, letterSpacing: 3, color: "#3d9bff", textTransform: "uppercase" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000 }}>
          <div style={{ display: "flex", fontSize: title.length > 60 ? 52 : 62, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>{title}</div>
          {description ? <div style={{ display: "flex", fontSize: 26, lineHeight: 1.4, color: "#b3bdc8", fontFamily: "sans-serif" }}>{description}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: monoFont, fontSize: 18, color: "#8290a0", letterSpacing: 1 }}>
          <div style={{ display: "flex" }}>{footer}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: "#2fd4a4" }} />
            MANAGED IT · CYBERSECURITY · RECOVERY · ENGINEERING
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
