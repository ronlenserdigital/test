import type { CSSProperties } from "react";

/** Minimal stroke icon set (original paths, 24×24 grid). */
const PATHS = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  book: "M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7z",
  cards: "M7 4h12v14H7zM4 7v13h12",
  quiz: "M9 9a3 3 0 115 2c-1 .7-2 1.3-2 3M12 17.5v.5M12 3a9 9 0 100 18 9 9 0 000-18z",
  timer: "M12 8v5l3 2M9 2h6M12 4a8 8 0 100 16 8 8 0 000-16z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10zM12 13a1 1 0 100-2 1 1 0 000 2z",
  play: "M7 4l13 8-13 8z",
  pause: "M7 4h3v16H7zM14 4h3v16h-3z",
  stop: "M6 6h12v12H6z",
  prev: "M19 5L9 12l10 7zM5 5v14",
  next: "M5 5l10 7-10 7zM19 5v14",
  volume: "M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 010 6M19 6a8 8 0 010 12",
  mute: "M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12l5 5L20 7",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  highlight: "M15 4l5 5-9 9H6v-5zM4 21h16",
  note: "M5 4h14v12l-4 4H5zM15 20v-4h4",
  flag: "M5 21V4h11l-2 4 2 4H5",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.5",
  alert: "M12 3l10 18H2zM12 10v5M12 18v.5",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 018 0v4",
  sparkle: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  inbox: "M4 13l3-9h10l3 9v7H4zM4 13h5l1 3h4l1-3h5",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  menu: "M4 6h16M4 12h16M4 18h16",
  rain: "M7 16a5 5 0 01-.5-10A6 6 0 0118 7a4 4 0 01-1 8M8 19l-1 2M12 19l-1 2M16 19l-1 2",
  coffee: "M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 10h2a2 2 0 010 4h-2M8 2v3M12 2v3",
  wave: "M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  refresh: "M20 11a8 8 0 10-2 6M20 4v7h-7",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  link: "M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1",
  type: "M4 7V4h16v3M9 20h6M12 4v16",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, style, className }: { name: IconName; style?: CSSProperties; className?: string }) {
  const filled = name === "play" || name === "pause" || name === "stop" || name === "prev" || name === "next";
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={style} className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Logo() {
  return (
    <svg viewBox="0 0 1024 1024" aria-hidden="true">
      <rect width="1024" height="1024" rx="224" fill="#3E6FA8" />
      <circle cx="512" cy="512" r="300" fill="none" stroke="#F4B860" strokeWidth="56" />
      <path d="M512 300 V512 L660 600" fill="none" stroke="#FFFFFF" strokeWidth="56" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
