import { useState, type CSSProperties } from "react";
import { BoxIcon } from "./Icons";
import "./SmartImage.css";

interface SmartImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
  eager?: boolean;
  style?: CSSProperties;
}

export default function SmartImage({ src, alt, className = "", fit = "cover", eager = false, style }: SmartImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const loaded = !!src && loadedSrc === src;
  const failed = !src || failedSrc === src;

  return (
    <span className={`smart-image ${loaded ? "is-loaded" : ""} ${failed ? "is-failed" : ""} ${className}`} style={style}>
      {failed ? (
        <span className="smart-image-fallback">
          <BoxIcon size={28} />
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          style={{ objectFit: fit }}
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  );
}
