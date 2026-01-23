/**
 * Framer Motion Animation Presets
 * Shared animation utilities for consistent motion across the app
 */

import { Variants, Transition } from "framer-motion";

// ============================================================================
// TRANSITIONS
// ============================================================================

export const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1], // ease-spring
};

export const fastTransition: Transition = {
  duration: 0.15,
  ease: [0.22, 1, 0.36, 1],
};

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export const slideInVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { type: "spring", stiffness: 500, damping: 30 },
};

export const popInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export const staggerItemFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

// ============================================================================
// HOVER & TAP STATES
// ============================================================================

export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
  whileTap: { y: 0 },
};

export const cardHoverGlow = {
  whileHover: {
    y: -4,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 },
  },
  whileTap: { y: 0 },
};

export const buttonHover = {
  whileHover: { scale: 1.02, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98 },
};

export const buttonHoverSubtle = {
  whileHover: { scale: 1.01, transition: { duration: 0.15 } },
  whileTap: { scale: 0.99 },
};

export const iconHover = {
  whileHover: { scale: 1.1, transition: { duration: 0.15 } },
  whileTap: { scale: 0.95 },
};

export const linkHover = {
  whileHover: { x: 4, transition: { duration: 0.15 } },
};

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ============================================================================
// MODAL/DIALOG ANIMATIONS
// ============================================================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

export const sheetSlideIn: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

export const dropdownMenu: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: { duration: 0.1 },
  },
};

// ============================================================================
// SIDEBAR ANIMATIONS
// ============================================================================

export const sidebarExpand: Variants = {
  collapsed: { width: 64 },
  expanded: {
    width: 240,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export const sidebarLabelFade: Variants = {
  collapsed: { opacity: 0, width: 0 },
  expanded: {
    opacity: 1,
    width: "auto",
    transition: { delay: 0.1, duration: 0.2 },
  },
};

// ============================================================================
// SCROLL ANIMATIONS (for viewport-triggered animations)
// ============================================================================

export const scrollFadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export const scrollFadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export const scrollScaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Use this variant when reduced motion is preferred
 * Removes all animation while maintaining visibility
 */
export const reducedMotion = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
  transition: { duration: 0 },
};

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
  exit: { opacity: 1 },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates stagger delay for index-based animations
 * @param index - Item index in list
 * @param baseDelay - Base delay in seconds (default: 0.05)
 */
export const staggerDelay = (index: number, baseDelay = 0.05) => ({
  transition: { delay: index * baseDelay },
});

/**
 * Creates a custom transition with spring physics
 * @param stiffness - Spring stiffness (default: 400)
 * @param damping - Spring damping (default: 30)
 */
export const createSpringTransition = (
  stiffness = 400,
  damping = 30
): Transition => ({
  type: "spring",
  stiffness,
  damping,
});

/**
 * Creates a custom eased transition
 * @param duration - Duration in seconds
 * @param ease - Easing array (default: spring ease)
 */
export const createEasedTransition = (
  duration = 0.3,
  ease: [number, number, number, number] = [0.22, 1, 0.36, 1]
): Transition => ({
  duration,
  ease,
});
