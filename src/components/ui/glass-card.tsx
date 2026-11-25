"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { MagicGlow } from "@/components/magic-glow";

type DivProps = React.HTMLAttributes<HTMLDivElement> & { hover?: boolean; glow?: boolean };

/** Paper card in the SAT Nexus style; optional cursor-tracking MagicGlow. */
export function GlassCard({ className, children, hover = true, glow = true, ...props }: DivProps) {
  const card = (
    <div
      {...props}
      className={cn(
        "glass relative overflow-hidden transition-colors duration-150",
        hover && "hover:border-[var(--accent)]",
        className,
      )}
    >
      {children}
    </div>
  );
  if (!glow) return card;
  return <MagicGlow className="h-full rounded-lg">{card}</MagicGlow>;
}

/** Shimmer skeleton used while data loads (SAT Nexus PageSkeleton). */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="skeleton-panel p-5">
          <div className="skeleton-line w-1/3" />
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="skeleton-line" style={{ width: `${88 - j * 12}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
