"use client";

import { motion } from "framer-motion";
import * as React from "react";

const enter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
};

/**
 * Figma spec: fade + slight upward slide (200ms) on route entry.
 */
export function PageEnter({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={enter.initial} animate={enter.animate} transition={enter.transition}>
      {children}
    </motion.div>
  );
}
