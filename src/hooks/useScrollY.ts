import { useEffect, useState } from "react";

export function useScrolledPast(threshold: number) {
  const [past, setPast] = useState(() => typeof window !== "undefined" && window.scrollY > threshold);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return past;
}
