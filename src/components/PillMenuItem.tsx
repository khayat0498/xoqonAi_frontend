"use client";

import Link from "next/link";
import clsx from "clsx";

/* ─── Crescent SVG (3D pufak effekti) ─── */
function CrescentOverlay({ size }: { size: number }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
    >
      <path
        d="M33 10 C36 16, 36 32, 33 38"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="19"
        cy="19"
        rx="9"
        ry="11"
        fill="rgba(255,255,255,0.12)"
        transform="rotate(-25 19 19)"
      />
    </svg>
  );
}

/* ─── Types ─── */
interface PillMenuItemProps {
  color: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { oval: 34, h: 42, text: "text-[0.88rem] md:text-[0.95rem]", gap: 10 },
  md: { oval: 42, h: 50, text: "text-[0.95rem] md:text-base",      gap: 12 },
  lg: { oval: 50, h: 58, text: "text-base md:text-lg",              gap: 14 },
};

export default function PillMenuItem({
  color,
  label,
  icon,
  href,
  active = false,
  onClick,
  size = "md",
  className,
}: PillMenuItemProps) {
  const s = sizes[size];

  const content = (
    <>
      {/* Rangli oval — clay pufak */}
      <div
        className="relative shrink-0 rounded-full flex items-center justify-center"
        style={{
          width: s.oval,
          height: s.oval,
          background: color,
          boxShadow: `
            3px 3px 8px rgba(0,0,0,0.12),
            inset -2px -2px 4px rgba(0,0,0,0.1),
            inset 2px 2px 4px rgba(255,255,255,0.25)
          `,
        }}
      >
        {icon && (
          <span className="relative z-10 text-white flex items-center justify-center">
            {icon}
          </span>
        )}
        <CrescentOverlay size={s.oval} />
      </div>

      {/* Label */}
      <span
        className={clsx(s.text, "font-semibold truncate")}
        style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
      >
        {label}
      </span>
    </>
  );

  const sharedClassName = clsx(
    "pill-menu-item flex items-center w-full transition-all duration-200",
    active && "pill-menu-active",
    className
  );

  const sharedStyle: React.CSSProperties = {
    height: s.h,
    paddingLeft: 4,
    paddingRight: 18,
    gap: s.gap,
    background: "var(--bg-card)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid var(--border)",
    borderRadius: s.h / 2,
    boxShadow: "var(--shadow-clay-sm)",
    cursor: "pointer",
  };

  if (href) {
    return (
      <Link href={href} className={sharedClassName} style={sharedStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button className={sharedClassName} style={sharedStyle} onClick={onClick}>
      {content}
    </button>
  );
}
