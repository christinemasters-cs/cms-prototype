"use client";

import Link from "next/link";
import { Palette } from "lucide-react";

export function BrandKitBadge() {
  return (
    <Link
      href="/brand-kit/projects"
      aria-label="Brand Kit"
      className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-[13px] font-semibold text-[color:var(--color-brand)] shadow-sm transition hover:border-[color:var(--color-brand)]"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)]/60">
        <Palette className="h-4 w-4" aria-hidden="true" />
      </span>
      Brand Kit
    </Link>
  );
}
