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
      aria-label="KeKucino robot chef"
    >
      {/* Chef toque — tall white hat */}
      <ellipse cx="32" cy="17" rx="13" ry="4" fill="white" opacity="0.95" />
      <rect x="23" y="5" width="18" height="14" rx="5" fill="white" opacity="0.95" />
      {/* Hat highlight */}
      <rect x="26" y="7" width="6" height="9" rx="3" fill="white" opacity="0.4" />
      {/* Hat band */}
      <rect x="23" y="17" width="18" height="3" rx="1.5" fill="#d97706" />

      {/* Robot body / head */}
      <rect x="16" y="22" width="32" height="26" rx="8" fill="#374151" />
      {/* Head highlight */}
      <rect x="18" y="23" width="14" height="7" rx="4" fill="#4b5563" opacity="0.5" />

      {/* Antenna */}
      <line x1="32" y1="22" x2="32" y2="17" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="16.5" r="2" fill="#f59e0b" />

      {/* Eyes */}
      <rect x="20" y="29" width="9" height="7" rx="3" fill="#1f2937" />
      <rect x="35" y="29" width="9" height="7" rx="3" fill="#1f2937" />
      {/* Eye glow */}
      <rect x="21" y="30" width="7" height="5" rx="2.5" fill="#3b82f6" opacity="0.9" />
      <rect x="36" y="30" width="7" height="5" rx="2.5" fill="#3b82f6" opacity="0.9" />
      {/* Eye highlight */}
      <circle cx="25" cy="32.5" r="1.5" fill="white" opacity="0.7" />
      <circle cx="40" cy="32.5" r="1.5" fill="white" opacity="0.7" />

      {/* Mouth / speaker grill */}
      <rect x="23" y="40" width="18" height="5" rx="2.5" fill="#1f2937" />
      <rect x="25" y="41.5" width="3" height="2" rx="1" fill="#10b981" />
      <rect x="30" y="41.5" width="3" height="2" rx="1" fill="#10b981" />
      <rect x="35" y="41.5" width="3" height="2" rx="1" fill="#10b981" />

      {/* Side bolts */}
      <circle cx="16" cy="32" r="3" fill="#4b5563" />
      <circle cx="16" cy="32" r="1.5" fill="#6b7280" />
      <circle cx="48" cy="32" r="3" fill="#4b5563" />
      <circle cx="48" cy="32" r="1.5" fill="#6b7280" />

      {/* Chest indicator */}
      <circle cx="32" cy="52" r="3" fill="#d97706" opacity="0.9" />
      <circle cx="32" cy="52" r="1.5" fill="#fbbf24" />
    </svg>
  );
}
