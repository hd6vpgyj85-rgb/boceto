import { useEffect, useRef, useState } from "react";
import { useSiteSettings } from "../hooks/useSiteData";
import { useCart } from "../context/CartContext";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import { WhatsAppIcon } from "./Icons";
import "./WhatsAppButton.css";

const HINT_KEY = "boceto-wa-hint-seen";
const POSITION_KEY = "boceto-wa-position";
const DRAG_THRESHOLD = 6;

type Side = "left" | "right";

interface SavedPosition {
  side: Side;
  y: number;
}

interface DragStart {
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
  moved: boolean;
}

const DEFAULT_POSITION: SavedPosition = { side: "right", y: 1 };

function readSeen(): boolean {
  try {
    return sessionStorage.getItem(HINT_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen(): boolean {
  try {
    sessionStorage.setItem(HINT_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

function readPosition(): SavedPosition {
  try {
    const parsed = JSON.parse(localStorage.getItem(POSITION_KEY) ?? "null");
    if (parsed && (parsed.side === "left" || parsed.side === "right") && typeof parsed.y === "number") {
      return { side: parsed.side, y: Math.min(1, Math.max(0, parsed.y)) };
    }
    return DEFAULT_POSITION;
  } catch {
    return DEFAULT_POSITION;
  }
}

function savePosition(position: SavedPosition): boolean {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    return true;
  } catch {
    return false;
  }
}

function getMetrics() {
  const mobile = window.innerWidth <= 640;
  const size = mobile ? 52 : 56;
  const margin = mobile ? 16 : 22;
  const minY = 84;
  return {
    size,
    margin,
    minY,
    maxX: window.innerWidth - size - margin,
    maxY: Math.max(minY, window.innerHeight - size - margin),
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function WhatsAppButton() {
  const { settings } = useSiteSettings();
  const { lastAdded } = useCart();
  const [hint, setHint] = useState(false);
  const [saved, setSaved] = useState<SavedPosition>(readPosition);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [, setViewport] = useState(0);
  const justDragged = useRef(false);

  useEffect(() => {
    if (readSeen()) return;
    const show = window.setTimeout(() => setHint(true), 6000);
    const hide = window.setTimeout(() => {
      setHint(false);
      markSeen();
    }, 13000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setViewport((n) => n + 1);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  if (!settings?.whatsapp) return null;

  const metrics = getMetrics();
  const resting = {
    x: saved.side === "left" ? metrics.margin : metrics.maxX,
    y: metrics.minY + saved.y * (metrics.maxY - metrics.minY),
  };
  const position = drag ?? resting;
  const message = `¡Hola, ${settings.business_name}! Tengo una pregunta sobre sus productos.`;

  const pointFrom = (e: PointerEvent, s: DragStart) => {
    const m = getMetrics();
    return {
      x: clamp(s.x + e.clientX - s.pointerX, m.margin, m.maxX),
      y: clamp(s.y + e.clientY - s.pointerY, m.minY, m.maxY),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const s: DragStart = { pointerX: e.clientX, pointerY: e.clientY, x: position.x, y: position.y, moved: false };

    const onMove = (ev: PointerEvent) => {
      if (!s.moved) {
        if (Math.hypot(ev.clientX - s.pointerX, ev.clientY - s.pointerY) < DRAG_THRESHOLD) return;
        s.moved = true;
        setHint(false);
      }
      ev.preventDefault();
      setDrag(pointFrom(ev, s));
    };

    const onEnd = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      if (!s.moved) return;
      justDragged.current = true;
      window.setTimeout(() => {
        justDragged.current = false;
      }, 350);
      const m = getMetrics();
      const point = pointFrom(ev, s);
      const next: SavedPosition = {
        side: point.x + m.size / 2 < window.innerWidth / 2 ? "left" : "right",
        y: m.maxY > m.minY ? (point.y - m.minY) / (m.maxY - m.minY) : 1,
      };
      setSaved(next);
      savePosition(next);
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!justDragged.current) return;
    e.preventDefault();
    justDragged.current = false;
  };

  const raised = !!lastAdded && !drag && saved.y > 0.6;

  return (
    <div
      className={`whatsapp-fab-wrap is-${saved.side} ${drag ? "is-dragging" : ""} ${raised ? "is-raised" : ""}`}
      style={{ left: position.x, top: position.y }}
    >
      <span className={`whatsapp-fab-hint ${hint && !drag ? "is-visible" : ""}`}>¿Tienes dudas? Escríbenos</span>
      <a
        href={buildWhatsAppUrl(settings.whatsapp, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        aria-label="Escribir por WhatsApp"
        title="Escríbenos por WhatsApp. Puedes arrastrar este botón."
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onMouseEnter={() => !drag && setHint(true)}
        onMouseLeave={() => setHint(false)}
      >
        <WhatsAppIcon size={26} />
      </a>
    </div>
  );
}
