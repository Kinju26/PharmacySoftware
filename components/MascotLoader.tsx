"use client";

import { useEffect, useState } from "react";

export function MascotLoader() {
  const [visible, setVisible] = useState(true);
  const [out, setOut] = useState(false);
  const [hello, setHello] = useState(false);

  useEffect(() => {
    const greet = window.setTimeout(() => setHello(true), 3400);
    const hide = window.setTimeout(() => setOut(true), 5200);
    const remove = window.setTimeout(() => setVisible(false), 6000);
    return () => {
      window.clearTimeout(greet);
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="mascotLoader"
      className={[out ? "out" : "", hello ? "mi-hello" : ""].filter(Boolean).join(" ")}
      aria-label="Loading"
    >
      <div className="mi-wrap">
        <div className="mi-bubble" role="status">
          {hello
            ? "Hello Admin, how are you? Your stock and sales reports are ready. Let's keep the pharmacy running smoothly!"
            : ""}
        </div>
        <img
          className={`mi-mascot ${hello ? "mi-wave" : "mi-float"}`}
          src="/images/loading-mascot.webp?v=10"
          alt=""
          draggable={false}
        />
        <div className="mi-load" aria-hidden={hello}>
          <div className="mi-bar">
            <i />
          </div>
          <p>Loading pharmacy…</p>
        </div>
      </div>
    </div>
  );
}
