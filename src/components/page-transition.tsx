"use client";

import * as React from "react";
import { motion } from "motion/react";
import { useSettings } from "@/components/settings-provider";

/**
 * Page-enter animation (SAT Nexus style): content fades up with a soft
 * blur and settles. Disabled when reduced motion is on.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  if (settings.reducedMotion) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: [0.22, 0.8, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered list container + item for bank cards, leaderboard rows, etc. */
export function StaggerList({ children, className }: { children: React.ReactNode; className?: string }) {
  const { settings } = useSettings();
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: settings.reducedMotion ? {} : { transition: { staggerChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const { settings } = useSettings();
  if (settings.reducedMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 0.8, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
