export function AutopilotMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="url(#ap-mark-bg)" />
      <path
        d="M12 26.5L20 10.5L28 26.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 20.5H24.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="28.5" r="2" fill="#ff4d6d" />
      <defs>
        <linearGradient id="ap-mark-bg" x1="8" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2a2a32" />
          <stop offset="1" stopColor="#16161a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
