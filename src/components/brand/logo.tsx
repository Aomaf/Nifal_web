type LogoProps = {
  className?: string;
  inverted?: boolean;
};

/** Full SVG wordmark — use on light backgrounds by default, pass inverted for dark */
export function NafalLogo({ className = "h-10 w-auto", inverted = false }: LogoProps) {
  return (
    <img
      src="/Logo.svg"
      alt="نِفال العقارية"
      className={`${className}${inverted ? " brightness-0 invert" : ""}`}
    />
  );
}

/** Two-line text lockup: نِفال / العقارية — no SVG, pure text */
export function NafalLogoStacked({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="inline-flex flex-col items-end leading-none" aria-label="نِفال العقارية">
      <span
        className="text-[18px] font-bold tracking-tight"
        style={{ color: inverted ? "#ffffff" : "var(--color-primary)" }}
      >
        نِفال
      </span>
      <span
        className="mt-0.5 text-[10px] font-normal tracking-[0.12em]"
        style={{ color: inverted ? "rgba(255,255,255,0.55)" : "var(--color-muted-foreground)" }}
      >
        العقارية
      </span>
    </div>
  );
}
