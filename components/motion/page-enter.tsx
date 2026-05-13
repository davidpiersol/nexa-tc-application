"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

/**
 * Route entry motion — intentional tradeoff vs the original fade-from-zero design:
 *
 * SSR and the first HTML paint MUST NOT use `opacity: 0`: if scripts fail to load or
 * hydrate (stale webpack chunks, CSP edge cases on another origin, paused tab), users
 * would see a permanently blank login shell while the markup is actually there.
 *
 * Keep a subtle vertical ease only (`y`), always fully opaque.
 */
export function PageEnter({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  // `null` = unknown (SSR / first frame). Only skip motion when explicitly true to avoid
  // tree mismatch and odd hydration edge cases.
  if (reduceMotion === true) {
    return children;
  }

  return (
    <motion.div
      initial={{ opacity: 1, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
