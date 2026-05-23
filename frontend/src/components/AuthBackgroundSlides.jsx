import { useEffect, useState } from "react";

const base = process.env.PUBLIC_URL || "";

/** Paths under `public/login-bg/` — replace files to customize the carousel. */
export const AUTH_BACKGROUND_IMAGES = [
  `${base}/login-bg/bg1.jpg`,
  `${base}/login-bg/bg2.jpg`,
  `${base}/login-bg/bg3.jpg`,
  `${base}/login-bg/bg4.jpg`,
];

const DEFAULT_INTERVAL_MS = 7500;

/**
 * Full-viewport slideshow behind auth forms (crossfade). Expects `.auth-layout` + rules in auth.css.
 */
export default function AuthBackgroundSlides({
  intervalMs = DEFAULT_INTERVAL_MS,
  images = AUTH_BACKGROUND_IMAGES,
}) {
  const [active, setActive] = useState(0);
  const list =
    Array.isArray(images) && images.length > 0 ? images : AUTH_BACKGROUND_IMAGES;

  useEffect(() => {
    if (list.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % list.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, list.length]);

  if (!list.length) return null;

  return (
    <>
      <div className="auth-bg" aria-hidden>
        {list.map((src, i) => (
          <div
            key={src}
            className={`auth-bg-slide${i === active ? " auth-bg-slide--active" : ""}`}
            style={{ backgroundImage: `url("${src}")` }}
          />
        ))}
      </div>
      <div className="auth-bg-scrim" aria-hidden />
    </>
  );
}
