import React from "react";

export const MoroccanLantern = ({ size = 24, color = "#C7A253", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="9" y="3" width="6" height="3" rx="2" fill={color} />
    <rect x="7" y="6" width="10" height="10" rx="5" fill={color} />
    <rect x="10" y="16" width="4" height="4" rx="2" fill={color} />
    <circle cx="12" cy="21" r="1" fill={color} />
  </svg>
);

export const MoroccanArch = ({ size = 24, color = "#C7A253", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4 20V12a8 8 0 0116 0v8" stroke={color} strokeWidth="2" fill="none" />
    <path d="M8 20v-6a4 4 0 018 0v6" stroke={color} strokeWidth="2" fill="none" />
  </svg>
);

export const MoroccanScissors = ({ size = 24, color = "#C7A253", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="6" cy="18" r="2" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="18" cy="18" r="2" stroke={color} strokeWidth="2" fill="none" />
    <path d="M8 16L20 4" stroke={color} strokeWidth="2" />
    <path d="M16 16L4 4" stroke={color} strokeWidth="2" />
  </svg>
);

export const MoroccanStar = ({ size = 24, color = "#C7A253", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <polygon points="12,2 13.8,8.5 20.5,8.5 15,12.5 16.8,19 12,15.5 7.2,19 9,12.5 3.5,8.5 10.2,8.5" fill={color} />
  </svg>
); 