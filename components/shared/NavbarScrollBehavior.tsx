"use client";

import { useEffect, useRef } from "react";

export function NavbarScrollBehavior() {
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const navbar = document.getElementById("app-navbar");
      if (!navbar) {
        return;
      }

      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      // Do not flicker near top of page.
      if (currentY < 16) {
        navbar.classList.remove("-translate-y-full");
        lastScrollYRef.current = currentY;
        return;
      }

      if (Math.abs(delta) > 8) {
        if (delta > 0) {
          navbar.classList.add("-translate-y-full");
        } else {
          navbar.classList.remove("-translate-y-full");
        }
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
