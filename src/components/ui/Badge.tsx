import { ReactNode, CSSProperties } from "react";

type BadgeVariant = "ok" | "warn" | "risk" | "info" | "muted-b" | "obs";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Badge({ variant, children, className = "", style }: BadgeProps) {
  return (
    <span className={`badge ${variant || ""} ${className}`} style={style}>
      {children}
    </span>
  );
}
