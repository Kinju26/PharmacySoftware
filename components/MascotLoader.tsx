"use client";

import { useEffect, useState } from "react";

export function MascotLoader() {
  const [visible, setVisible] = useState(true);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const hide = window.setTimeout(() => setOut(true), 3400);
    const remove = window.setTimeout(() => setVisible(false), 4200);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, []);

  if (!visible) return null;

  return (
    <div id="mascotLoader" className={out ? "out" : ""} aria-label="Loading">
      <div className="stage">
        <div className="bob">
          <img
            className="mascot-img"
            src="/images/loading-mascot.webp?v=4"
            alt=""
            draggable={false}
          />
        </div>
        <div className="track">
          <i />
        </div>
      </div>
    </div>
  );
}
