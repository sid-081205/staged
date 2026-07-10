"use client";

import { useEffect, useRef, useState } from "react";

/** Fades and lifts children in when they enter the viewport. */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;

    // Anything already in the viewport shows immediately.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);

    // Fail-open: never leave content hidden (broken IO, prerender, etc).
    const safety = setTimeout(() => setShown(true), 2500);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: !mounted || shown ? 1 : 0,
        transform: !mounted || shown ? "none" : "translateY(20px)",
        transition: mounted
          ? `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`
          : undefined,
      }}
    >
      {children}
    </div>
  );
}
