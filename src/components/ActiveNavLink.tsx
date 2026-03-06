"use client";

/**
 * ActiveNavLink
 *
 * Minimal "use client" boundary. Reads pathname, sets data-active and
 * aria-current, then forwards className so the parent layout can supply
 * its own CSS class (e.g. "pw-nav-link") for hover/active styling.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  href: string;
  /** exact=true → active only when pathname === href */
  exact?: boolean;
  /** Allow parent to inject its own CSS class for hover/active styles */
  className?: string;
  children: ReactNode;
};

export function ActiveNavLink({ href, exact = false, className = "", children }: Props) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}