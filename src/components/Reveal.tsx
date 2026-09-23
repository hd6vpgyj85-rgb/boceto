import type { CSSProperties, ReactNode } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
}

export default function Reveal({ children, className = "", delay = 0, as = "div" }: RevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {};
  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${isVisible ? "is-visible" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
}

interface StaggerGroupProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerMs?: number;
}

export function StaggerGroup({
  children,
  className = "",
  itemClassName = "",
  staggerMs = 60,
}: StaggerGroupProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`stagger-item ${isVisible ? "is-visible" : ""} ${itemClassName}`.trim()}
          style={{ transitionDelay: `${index * staggerMs}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
