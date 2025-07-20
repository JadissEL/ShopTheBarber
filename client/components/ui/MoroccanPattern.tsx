import React from "react";

// A classic Moroccan star/zellige pattern, subtle and tileable
const MoroccanPattern: React.FC<{
  color?: string;
  opacity?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ color = "#C7A253", opacity = 0.08, size = 48, className = "", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <g opacity={opacity}>
      {/* 8-pointed star */}
      <polygon
        points="24,2 28,16 46,16 31,26 36,44 24,34 12,44 17,26 2,16 20,16"
        fill={color}
      />
      {/* Center circle */}
      <circle cx="24" cy="24" r="4" fill={color} opacity={0.5} />
      {/* Small dots for extra detail */}
      <circle cx="24" cy="8" r="1.2" fill={color} />
      <circle cx="24" cy="40" r="1.2" fill={color} />
      <circle cx="8" cy="24" r="1.2" fill={color} />
      <circle cx="40" cy="24" r="1.2" fill={color} />
    </g>
  </svg>
);

export default MoroccanPattern; 