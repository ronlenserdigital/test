import localFont from "next/font/local";

/**
 * Self-hosted variable fonts (SIL Open Font License). Files live in src/styles.
 * Manrope: display/headlines. Inter: body. JetBrains Mono: labels, data, eyebrows.
 */
export const manrope = localFont({
  src: "../styles/manrope-latin-wght.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const inter = localFont({
  src: "../styles/inter-latin-wght.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const jetbrainsMono = localFont({
  src: "../styles/jetbrains-mono-latin-wght.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "Menlo", "monospace"],
});
