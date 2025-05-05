import React from 'react';

interface HardHatIconProps {
  className?: string;
  color?: string;
}

const HardHatIcon: React.FC<HardHatIconProps> = ({ className = "w-24 h-24", color = "#FFD54F" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      fill={color}
      stroke="#333"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Hard Hat */}
      <path d="M256 96c-88.4 0-160 71.6-160 160v64h320v-64c0-88.4-71.6-160-160-160zm-96 160c0-53 43-96 96-96s96 43 96 96v16H160v-16z" />
      <path d="M96 320v32c0 17.7 14.3 32 32 32h256c17.7 0 32-14.3 32-32v-32H96z" />

      {/* Straps */}
      <path d="M192 96v64M320 96v64" strokeWidth="12" stroke="#333" />

      {/* Face/Eyes */}
      <circle cx="200" cy="200" r="12" fill="#333" stroke="none" />
      <circle cx="312" cy="200" r="12" fill="#333" stroke="none" />

      {/* Smile */}
      <path d="M220 240 C 240 270, 272 270, 292 240" fill="none" stroke="#333" strokeWidth="8" />
    </svg>
  );
};

export default HardHatIcon;
