import Link from "next/link";
import { Icon } from "@/components/icons/icon";

export interface Crumb {
  label: string;
  href: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-fg-2">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-fg">
                  {item.label}
                </Link>
              )}
              {!last ? <Icon name="chevron-down" size={14} className="-rotate-90 opacity-60" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
