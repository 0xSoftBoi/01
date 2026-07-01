// The kyd labs wordmark: a downward arrow landing on a bar, above the
// lowercase "kyd labs" mark. An original rendering of the real brand's
// icon/wordmark relationship (arrow + lowercase mark + "keep your
// distribution" tagline) — see canton/kyd-tix/app/README.md.
export function LogoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v11.5M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}

export default function Logo({ size = "md", tagline = false }: { size?: "md" | "xl"; tagline?: boolean }) {
  return (
    <span className={`logo logo-${size}`}>
      <span className="logo-icon">
        <LogoIcon size={size === "xl" ? 30 : 18} />
      </span>
      <span className="logo-word">
        kyd labs
        {tagline && <span className="logo-tagline">keep your distribution</span>}
      </span>
    </span>
  );
}
