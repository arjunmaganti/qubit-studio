import { useId } from 'react';

export default function MylaIcon({ size = 36 }: { size?: number }) {
  const gid = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      aria-hidden
      className="myla-icon"
    >
      <defs>
        <linearGradient id={gid} x1="8" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c5cff" />
          <stop offset="0.45" stopColor="#1a6fe0" />
          <stop offset="1" stopColor="#12b5a0" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="16" fill={`url(#${gid})`} />
      <ellipse cx="18" cy="18" rx="11" ry="5.5" fill="none" stroke="#eaf2ff" strokeWidth="1.4" opacity="0.9" />
      <ellipse cx="18" cy="18" rx="5.5" ry="11" fill="none" stroke="#eaf2ff" strokeWidth="1.4" opacity="0.55" transform="rotate(35 18 18)" />
      <circle cx="18" cy="18" r="3.2" fill="#fff7d6" />
      <circle cx="18" cy="18" r="1.3" fill="#1a6fe0" />
    </svg>
  );
}
