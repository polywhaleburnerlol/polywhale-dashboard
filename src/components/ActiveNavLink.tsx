"use client";

/**
 * ActiveNavLink
 *
 * Isolated "use client" component: reads the current pathname and applies
 * active amber styling to the matching sidebar link.
 *
 * Keeping this tiny file as the only client boundary means DashboardLayout
 * stays a pure Server Component — no unnecessary JS shipped for the shell.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  href: string;
  /**
   * exact=true  → active only when pathname === href   (use for /dashboard)
   * exact=false → active when pathname starts with href (use for nested routes)
   */
  exact?: boolean;
  children: ReactNode;
};

export function ActiveNavLink({ href, exact = false, children }: Props) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={[
        // Layout & typography
        "flex items-center gap-3 rounded-lg px-3 py-2.5",
        "text-sm font-medium transition-all duration-150",
        // Default state
        "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100",
        // Icon colour (first SVG child)
        "[&>svg]:shrink-0 [&>svg]:transition-colors",
        isActive
          // Active state — amber tint
          ? "bg-amber-400/10 text-amber-300 [&>svg]:text-amber-400"
          // Inactive icon colour + hover
          : "[&>svg]:text-zinc-500 hover:[&>svg]:text-zinc-300",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}