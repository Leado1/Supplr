/**
 * useReducedMotion Hook
 * Detects user's reduced motion preference for accessible animations
 */

import { useState, useEffect } from "react";

/**
 * Returns true if the user prefers reduced motion
 * Use this to conditionally disable or simplify animations
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * const variants = prefersReducedMotion ? reducedMotionVariants : slideUpVariants;
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation props based on reduced motion preference
 * Pass in your desired animation and it will return either that or a no-op
 *
 * @example
 * ```tsx
 * const animationProps = useMotionSafe(slideUp);
 * return <motion.div {...animationProps}>Content</motion.div>
 * ```
 */
export function useMotionSafe<T extends object>(animation: T): T | object {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0 },
    };
  }

  return animation;
}

export default useReducedMotion;
