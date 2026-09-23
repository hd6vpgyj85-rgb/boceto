import type { ReactNode } from "react";
import { BagIcon, BoxIcon, SearchIcon } from "./Icons";
import "./EmptyState.css";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: "bag" | "search" | "box";
}

export default function EmptyState({ title, description, action, icon = "bag" }: EmptyStateProps) {
  const Icon = icon === "search" ? SearchIcon : icon === "box" ? BoxIcon : BagIcon;

  return (
    <div className="empty-state">
      <div className="empty-state-art" aria-hidden="true">
        <span className="empty-state-ring" />
        <span className="empty-state-ring empty-state-ring-2" />
        <span className="empty-state-icon">
          <Icon size={44} strokeWidth={1.5} />
        </span>
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
