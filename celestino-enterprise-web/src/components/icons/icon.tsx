import type { SVGProps } from "react";
import type { IconName } from "./icon-names";

/**
 * Celestino icon set. 24px grid, 1.5px stroke, round joins, no fills.
 * Every path is authored here so the whole site shares one geometry.
 */
const paths: Record<IconName, React.ReactNode> = {
  shield: <path d="M12 3 4.5 6v5.2c0 4.4 3.1 8.2 7.5 9.8 4.4-1.6 7.5-5.4 7.5-9.8V6L12 3Z" />,
  "shield-check": (
    <>
      <path d="M12 3 4.5 6v5.2c0 4.4 3.1 8.2 7.5 9.8 4.4-1.6 7.5-5.4 7.5-9.8V6L12 3Z" />
      <path d="m9 12 2 2 4-4.5" />
    </>
  ),
  server: (
    <>
      <rect x="3.5" y="4" width="17" height="6.5" rx="1.5" />
      <rect x="3.5" y="13.5" width="17" height="6.5" rx="1.5" />
      <path d="M7 7.25h.01M7 16.75h.01M11 7.25h3M11 16.75h3" />
    </>
  ),
  cloud: <path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.9 11.6 3.5 3.5 0 0 0 7 18.5Z" />,
  network: (
    <>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4m0 0-5.6 6.4M12 11l5.6 6.4" />
    </>
  ),
  backup: (
    <>
      <path d="M4 12a8 8 0 1 0 2.3-5.6" />
      <path d="M4 4v4.5h4.5" />
      <path d="M12 8v4.5l3 1.8" />
    </>
  ),
  advisory: (
    <>
      <path d="M4 5.5h16v10H9l-5 4v-14Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  code: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
  layers: <path d="m12 4 8 4-8 4-8-4 8-4ZM4 12l8 4 8-4M4 16l8 4 8-4" />,
  automation: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16.5V20M6.5 12l3-3 2.5 2.5 4-4.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.6M20.5 19a5.5 5.5 0 0 0-4-5.3" />
    </>
  ),
  identity: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16a3 3 0 0 1 6 0M14.5 9.5h3.5M14.5 13h3.5" />
    </>
  ),
  endpoint: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <path d="M7 20h10M12 17v3" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  ),
  building: (
    <>
      <path d="M4 20h16M6 20V6l6-3 6 3v14" />
      <path d="M9.5 9h1M13.5 9h1M9.5 12.5h1M13.5 12.5h1M10.5 20v-4h3v4" />
    </>
  ),
  hospital: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  bank: (
    <>
      <path d="M3 9.5 12 4l9 5.5H3ZM5 9.5V17M9.5 9.5V17M14.5 9.5V17M19 9.5V17M3 20h18" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
      <path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3 12.5h18" />
    </>
  ),
  storefront: (
    <>
      <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0M5.5 12v8h13v-8M10 20v-5h4v5" />
    </>
  ),
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  phone: <path d="M5.5 4h3l1.5 4-2 1.3a11 11 0 0 0 6.7 6.7L16 14l4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C10.6 19.6 4.4 13.4 4 5.6A1.5 1.5 0 0 1 5.5 4Z" />,
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  document: (
    <>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5v4h4M8.5 12h7M8.5 15.5h7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 3 19.5h18L12 4Z" />
      <path d="M12 10v4M12 16.5h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M4 4.5V9h4.5M20 19.5V15h-4.5" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  wrench: <path d="M14.5 6.5a4 4 0 0 0 4.7 5.6L20 11.3l-1.4-1.4 1.6-1.6-1.6-1.6-1.6 1.6L15.6 7l-1.1-.5ZM13 11l-8.5 8.5a1.4 1.4 0 0 0 2 2L15 13" />,
  activity: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  flag: <path d="M6 21V4M6 4h11l-2.5 3.5L17 11H6" />,
  handshake: <path d="m3 9 4-3 5 3-3 3.5a1.5 1.5 0 0 0 2 2.2L15 11l6-2M3 9v7l5.5 4 4-3M21 7v9l-4.5 3.5" />,
  badge: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m9 13.5-1.5 7 4.5-2.5 4.5 2.5-1.5-7" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  title?: string;
}

export function Icon({ name, size = 20, title, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
