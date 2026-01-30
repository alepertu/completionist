"use client";

import React from "react";
import { useMobileMenu } from "../../context/mobile-menu-context";

interface MobileMenuProps {
  /** Content to render inside the slide-in panel */
  children: React.ReactNode;
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {isOpen ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      )}
    </svg>
  );
}

export function MobileMenu({ children }: MobileMenuProps) {
  const { isOpen, toggle, close } = useMobileMenu();

  return (
    <>
      {/* Hamburger Button - fixed position, only visible on mobile */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-colors"
        onClick={toggle}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
      >
        <HamburgerIcon isOpen={isOpen} />
      </button>

      {/* Backdrop - click to close */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 md:hidden
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={close}
        aria-hidden="true"
      />

      {/* Slide-in Panel - ONLY on mobile */}
      <aside
        id="mobile-menu-panel"
        className={`
          fixed top-0 left-0 h-full w-64 z-50 md:hidden
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-hidden={!isOpen}
      >
        {children}
      </aside>
    </>
  );
}
