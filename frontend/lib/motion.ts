import { Variants, Transition, TargetAndTransition } from "framer-motion"

// Physics-based spring transition for natural feel
export const spring: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
}

export const softSpring: Transition = {
    type: "spring",
    stiffness: 200,
    damping: 40,
}

// Stagger children animations
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
}

// Fade In
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { type: "tween", duration: 0.3 }
    },
}

// Slide Up
export const slideUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: spring
    },
}

// Scale In
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
        opacity: 1,
        scale: 1,
        transition: spring
    },
}

// List Item (Slide from left)
export const listItem: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: {
        opacity: 1,
        x: 0,
        transition: spring
    },
}

// Hover effects
export const hoverScale: TargetAndTransition = {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
}

export const hoverLift: TargetAndTransition = {
    y: -2,
    transition: { type: "spring", stiffness: 400, damping: 10 }
}
