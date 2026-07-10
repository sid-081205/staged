/** The Stagely house mark: roof, walls, and an open door in the brand green. */
export default function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <polyline
        points="9,29 32,10 55,29"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 33 L16.5 54 L26 54 L25 52 L18 52 L17 33 Z" fill="currentColor" />
      <path d="M49 33 L47.5 54 L38 54 L39 52 L46 52 L47 33 Z" fill="currentColor" />
      <path d="M28 29 L40 29 L37 32.5 L33.5 32.5 L33.5 53.5 L28 57.5 Z" fill="#2d5a42" />
    </svg>
  );
}
