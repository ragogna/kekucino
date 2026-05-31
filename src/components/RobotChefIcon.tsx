interface RobotChefIconProps {
  size?: number;
  className?: string;
}

export function RobotChefIcon({ size = 48, className = "" }: RobotChefIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="KeKucino chef"
    >
      {/* Drop shadow under brim */}
      <ellipse cx="32" cy="57" rx="17" ry="3" fill="rgba(0,0,0,0.18)" />

      {/* Cylinder body */}
      <rect x="14" y="27" width="36" height="21" rx="2" fill="white" opacity="0.97" />
      {/* Pleat lines */}
      <rect x="21" y="27" width="1" height="19" rx="0.5" fill="rgba(190,178,162,0.7)" />
      <rect x="42" y="27" width="1" height="19" rx="0.5" fill="rgba(190,178,162,0.7)" />

      {/* Crown — three puffs (left, right, center tallest) */}
      <ellipse cx="21.5" cy="22" rx="9.5" ry="10.5" fill="white" opacity="0.97" />
      <ellipse cx="42.5" cy="22" rx="9.5" ry="10.5" fill="white" opacity="0.97" />
      <ellipse cx="32" cy="16" rx="12" ry="14" fill="white" />

      {/* Puff highlights */}
      <ellipse cx="29" cy="11" rx="3.5" ry="5" fill="white" opacity="0.28" />
      <ellipse cx="19" cy="18" rx="2.5" ry="4" fill="white" opacity="0.22" />

      {/* Brim */}
      <rect x="11" y="44" width="42" height="10" rx="5" fill="white" opacity="0.97" />
      {/* Amber accent band */}
      <rect x="11" y="46" width="42" height="4" rx="2" fill="#f59e0b" />
      {/* Band highlight */}
      <rect x="11" y="46" width="42" height="1.5" rx="0.75" fill="rgba(255,255,255,0.38)" />

      {/* 4-pointed star sparkle top-right */}
      <path
        d="M54 11 L55.2 14.2 L58.4 15.4 L55.2 16.6 L54 19.8 L52.8 16.6 L49.6 15.4 L52.8 14.2 Z"
        fill="#fbbf24"
        opacity="0.92"
      />
      {/* Small accent dots */}
      <circle cx="9" cy="20" r="1.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="58" cy="8" r="1" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}
