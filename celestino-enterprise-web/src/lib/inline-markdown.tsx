import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renders a plain-text string with inline markdown links `[label](/path)` and
 * `**bold**` spans as React nodes. Internal paths use next/link; external URLs
 * open in a new tab with rel=noopener. No HTML is ever injected.
 */
const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

export function inlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    if (match[1] && match[2]) {
      const href = match[2];
      const label = match[1];
      if (href.startsWith("/")) {
        nodes.push(
          <Link key={key++} href={href}>
            {label}
          </Link>,
        );
      } else {
        nodes.push(
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>,
        );
      }
    } else if (match[3]) {
      nodes.push(<strong key={key++}>{match[3]}</strong>);
    }
    last = start + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
