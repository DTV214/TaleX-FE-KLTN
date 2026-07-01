"use client";

import { Crown } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
} as const;

const buttonVariants = {
  rest: {
    width: 56,
  },
  hover: {
    width: 212,
  },
} as const;

const labelVariants = {
  rest: {
    opacity: 0,
    width: 0,
  },
  hover: {
    opacity: 1,
    width: "auto",
  },
} as const;

export function FloatingPremiumButton() {
  const router = useRouter();
  const pathname = usePathname();

  const hiddenRoutes = [
    "/admin",
    "/staff",
    "/login",
    "/register",
    "/forgot-password",
    "/complete-profile",
    "/premium",
    "/creator-dashboard",
  ];
  const isHidden = hiddenRoutes.some((route) => pathname.startsWith(route));

  if (isHidden) {
    return null;
  }

  const handleClick = () => {
    router.push("/premium");
  };

  return (
    <motion.button
      type="button"
      aria-label="Nâng cấp Premium"
      title="Nâng cấp Premium"
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      variants={buttonVariants}
      transition={springTransition}
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-50 flex h-14 items-center justify-center overflow-hidden rounded-full bg-[#D4AF37] text-neutral-900 shadow-[0_0_15px_rgba(212,175,55,0.5)] outline-none transition-shadow hover:shadow-[0_0_28px_rgba(212,175,55,0.72)] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black md:bottom-24 md:right-6"
    >
      <span className="flex min-w-0 items-center justify-center gap-2.5 px-4">
        <Crown className="h-6 w-6 shrink-0 fill-neutral-900/10" />
        <motion.span
          variants={labelVariants}
          transition={springTransition}
          className="overflow-hidden whitespace-nowrap font-sans text-sm font-bold"
        >
          Nâng cấp Premium
        </motion.span>
      </span>
    </motion.button>
  );
}
