import { useEffect, useRef, useState } from "react";
import { getWhatsAppUrl, storeInfo } from "../data/store";
import "./WhatsAppButton.css";

const STORAGE_KEY = "beautylat-whatsapp-btn-pos";
const SIZE = 60;
const MARGIN = 16;

interface Position {
  x: number;
  y: number;
}

function clamp(pos: Position): Position {
  const maxX = window.innerWidth - SIZE - MARGIN;
  const maxY = window.innerHeight - SIZE - MARGIN;
  return {
    x: Math.min(Math.max(pos.x, MARGIN), Math.max(maxX, MARGIN)),
    y: Math.min(Math.max(pos.y, MARGIN), Math.max(maxY, MARGIN)),
  };
}

function loadInitialPosition(): Position {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return clamp(JSON.parse(raw));
  } catch {
    // ignore
  }
  return clamp({ x: window.innerWidth - SIZE - MARGIN, y: window.innerHeight - SIZE - MARGIN * 4 });
}

export default function WhatsAppButton() {
  const [position, setPosition] = useState<Position>(loadInitialPosition);
  const [dragging, setDragging] = useState(false);
  const dragMoved = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => setPosition((p) => clamp(p));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragMoved.current = false;
    offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    dragMoved.current = true;
    const next = clamp({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    setPosition(next);
  };

  const handlePointerUp = () => {
    if (dragging) {
      setDragging(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragMoved.current) {
      e.preventDefault();
      dragMoved.current = false;
    }
  };

  return (
    <a
      href={getWhatsAppUrl(`Hola ${storeInfo.name}, tengo una pregunta 💬`)}
      target="_blank"
      rel="noopener noreferrer"
      className={`whatsapp-fab ${dragging ? "is-dragging" : ""}`}
      style={{ right: "auto", bottom: "auto", left: position.x, top: position.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      aria-label="Escríbenos por WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.32 4 14.87c0 2.27.63 4.39 1.72 6.21L4 29l8.13-1.68a12.9 12.9 0 0 0 3.91.6c6.64 0 12.04-5.32 12.04-11.87S22.68 3 16.04 3Zm0 21.6c-1.29 0-2.55-.24-3.72-.7l-.27-.1-4.83 1 1.02-4.62-.17-.29a9.68 9.68 0 0 1-1.5-5.02c0-5.36 4.42-9.72 9.87-9.72s9.87 4.36 9.87 9.72-4.42 9.73-9.87 9.73Zm5.4-7.28c-.29-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.29-.76.95-.93 1.15-.17.19-.34.22-.63.07-.29-.15-1.23-.45-2.35-1.44-.87-.77-1.46-1.72-1.63-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.49.1-.19.05-.36-.02-.51-.07-.15-.66-1.58-.9-2.17-.24-.57-.48-.49-.66-.5h-.56c-.19 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.19 3.03c.15.19 2.06 3.15 5 4.41.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.74-.71 1.98-1.4.24-.68.24-1.27.17-1.4-.07-.12-.27-.19-.56-.34Z"/>
      </svg>
    </a>
  );
}
