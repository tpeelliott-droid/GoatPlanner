import { useEffect, useState } from "react";

/**
 * Tracks the browser's visual viewport height, which shrinks when the
 * on-screen keyboard opens (unlike window.innerHeight / 100vh, which stay
 * fixed on iOS). Bottom sheets use this to stay above the keyboard instead
 * of being covered by it.
 */
export function useVisualViewportHeight() {
  const [height, setHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight,
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}
