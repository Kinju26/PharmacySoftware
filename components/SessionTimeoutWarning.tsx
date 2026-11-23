"use client";

import { useEffect, useRef, useState } from "react";
import { SESSION_IDLE_MS, SESSION_WARN_MS } from "@/lib/auth/messages";
import { usePharmacy } from "@/context/PharmacyContext";

export function SessionTimeoutWarning() {
  const { currentUser, logout } = usePharmacy();
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const lastActive = useRef(Date.now());
  const warned = useRef(false);
  const lastTouch = useRef(0);

  useEffect(() => {
    if (!currentUser) return;

    const bump = () => {
      lastActive.current = Date.now();
      if (warned.current) {
        warned.current = false;
        setOpen(false);
      }
      // Keep server session lastActive fresh (throttled).
      if (Date.now() - lastTouch.current > 60_000) {
        lastTouch.current = Date.now();
        void fetch("/api/auth/session").catch(() => undefined);
      }
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const tick = window.setInterval(() => {
      const idle = Date.now() - lastActive.current;
      const remaining = SESSION_IDLE_MS - idle;
      if (remaining <= 0) {
        setOpen(false);
        void logout({ timedOut: true });
        return;
      }
      if (remaining <= SESSION_WARN_MS) {
        warned.current = true;
        setOpen(true);
        setSecondsLeft(Math.max(1, Math.ceil(remaining / 1000)));
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(tick);
    };
  }, [currentUser, logout]);

  if (!open) return null;

  return (
    <div className="session-warn" role="alertdialog" aria-labelledby="sessionWarnTitle">
      <div className="session-warn-card">
        <h3 id="sessionWarnTitle">Session ending soon</h3>
        <p>
          You will be signed out in <b>{secondsLeft}s</b> due to inactivity.
        </p>
        <button
          type="button"
          className="session-warn-btn"
          onClick={() => {
            lastActive.current = Date.now();
            warned.current = false;
            setOpen(false);
          }}
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
