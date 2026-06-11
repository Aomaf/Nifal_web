type LogoProps = { className?: string; showText?: boolean };

export function NafalLogo({ className = "h-10 w-auto", showText = true }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${showText ? "" : ""}`} aria-label="نِفال العقارية">
      <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="nafal-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D9B97F" />
            <stop offset="1" stopColor="#A38554" />
          </linearGradient>
        </defs>
        {/* 6-petal mandala: 1 top, 2 middle, 3 bottom */}
        <circle cx="32" cy="12" r="7" fill="url(#nafal-gold)" />
        <circle cx="20" cy="28" r="7" fill="url(#nafal-gold)" />
        <circle cx="44" cy="28" r="7" fill="url(#nafal-gold)" />
        <circle cx="14" cy="48" r="7" fill="url(#nafal-gold)" />
        <circle cx="32" cy="48" r="7" fill="url(#nafal-gold)" />
        <circle cx="50" cy="48" r="7" fill="url(#nafal-gold)" />
      </svg>
      {showText && (
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-tight">نِفال</div>
          <div className="text-xs text-muted-foreground -mt-0.5">العقارية</div>
        </div>
      )}
    </div>
  );
}
