import React from "react";

interface DeniseLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  variant?: "light" | "dark" | "gold";
  showText?: boolean;
}

export default function DeniseLogo({
  className = "",
  size = "md",
  variant = "gold",
  showText = false,
}: DeniseLogoProps) {
  // Determine pixel sizes for standard responsive scaling
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-24 h-24 text-2xl",
    "3xl": "w-32 h-32 text-3xl",
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Determine standard color combinations based on aesthetic theme
  let bgClass = "bg-[#8E7D6F] text-white shadow-md";
  let borderClass = "border border-white/20";
  let ringColor = "rgba(142, 125, 111, 0.2)";

  if (variant === "dark") {
    bgClass = "bg-stone-900 text-amber-100 shadow-md";
    borderClass = "border border-amber-500/20";
    ringColor = "rgba(194, 154, 113, 0.2)";
  } else if (variant === "gold") {
    bgClass = "bg-gradient-to-br from-[#8E7D6F] via-[#a07f5b] to-[#c29a71] text-white shadow-lg";
    borderClass = "border border-white/10";
    ringColor = "rgba(194, 154, 113, 0.35)";
  } else if (variant === "light") {
    bgClass = "bg-[#F9F7F5] text-[#8E7D6F] border border-[#8E7D6F]/20";
    borderClass = "border border-transparent";
    ringColor = "rgba(142, 125, 111, 0.1)";
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`inline-flex items-center justify-center rounded-full shrink-0 relative overflow-hidden group select-none ${currentSize} ${bgClass} ${borderClass}`}
        style={{ boxShadow: `0 8px 24px 0 ${ringColor}` }}
      >
        {/* Delicate background decorative circle line inside */}
        <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none group-hover:scale-95 transition-all duration-300"></div>
        
        {/* Soft radial overlay shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-70"></div>

        {/* Exquisite branch/leaf background watermark */}
        <svg
          className="absolute w-full h-full opacity-15 text-white scale-110 pointer-events-none group-hover:rotate-12 transition-transform duration-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 21a9 9 0 0 0 9-9c0-1.66-1.34-3-3-3s-3 1.34-3 3M12 12A9 9 0 0 1 3 12" />
          <path d="M12 3a9 9 0 0 0-9 9c0 1.66 1.34 3 3 3s3-1.34 3-3" />
          <path d="M14.5 9.5c.5-.5 1-1.5.5-2.5s-1.5-.5-2 0M9.5 14.5c-.5.5-1 1.5-.5 2.5s1.5.5 2 0" />
        </svg>

        {/* Monogram stylized serif acronym */}
        <span className="font-serif font-bold tracking-widest relative z-10 select-none antialiased translate-x-[0.5px]">
          DF
        </span>
      </div>

      {showText && (
        <div className="text-center mt-2 font-[Cinzel]">
          <span className="block font-serif text-sm font-bold tracking-wider text-stone-850">DENISE FERREIRA</span>
          <span className="block text-[8px] tracking-widest text-[#8E7D6F] uppercase font-semibold">Enfermagem • Podologia • Estética</span>
        </div>
      )}
    </div>
  );
}
