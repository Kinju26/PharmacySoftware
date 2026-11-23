"use client";

/**
 * MascotHero — the ONE mascot used across the whole site.
 * Shows the mascot + a speech bubble. Login and Sign up both render this.
 *
 *   <MascotHero message="Welcome back! 👋" size="lg" />
 *
 * `reaction` makes the mascot do a one-off move. Pass a NEW object each time:
 *   { type: "wave" | "jump" | "shake" | "celebrate", id: Date.now() }
 */

import { useEffect, useRef } from "react";
import "./Mascot.css";

export type Reaction = {
  type: "wave" | "jump" | "shake" | "celebrate";
  id: number;
} | null;

type Props = {
  message: string;
  reaction?: Reaction;
  tilted?: boolean; // true = mascot tilts (e.g. while password is focused)
  size?: "lg" | "md"; // lg = login (138px), md = sign up (108px)
  src?: string; // mascot image path
};

const ease = "ease-in-out";

function confetti(host: HTMLDivElement) {
  const icons = ["💊", "➕", "✨", "🎉", "💙", "🩺"];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("span");
    s.textContent = icons[i % icons.length];
    s.style.setProperty("--dx", `${Math.random() * 300 - 90}px`);
    s.style.setProperty("--dy", `${Math.random() * -70 + Math.random() * 190}px`);
    s.style.setProperty("--r", `${Math.random() * 540 - 270}deg`);
    s.style.animationDelay = `${Math.random() * 0.2}s`;
    host.appendChild(s);
    setTimeout(() => s.remove(), 1800);
  }
}

export default function MascotHero({
  message,
  reaction = null,
  tilted = false,
  size = "lg",
  src = "/mascot.png",
}: Props) {
  const mascotRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mascotRef.current;
    if (!reaction || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const jump = (n: number) =>
      el.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(-22px) scale(1.04, 1.06)" },
          { transform: "translateY(0)" },
        ],
        { duration: 450, iterations: n, easing: "ease-out" }
      );

    switch (reaction.type) {
      case "wave":
        el.animate(
          [
            { transform: "rotate(0)" },
            { transform: "rotate(-8deg) translateY(-6px)" },
            { transform: "rotate(8deg) translateY(-4px)" },
            { transform: "rotate(0)" },
          ],
          { duration: 800, easing: ease }
        );
        break;
      case "jump":
        jump(1);
        break;
      case "shake":
        el.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-9px) rotate(-3deg)" },
            { transform: "translateX(9px) rotate(3deg)" },
            { transform: "translateX(-6px)" },
            { transform: "translateX(6px)" },
            { transform: "translateX(0)" },
          ],
          { duration: 500, easing: ease }
        );
        break;
      case "celebrate":
        jump(3);
        if (confettiRef.current) confetti(confettiRef.current);
        break;
      default: {
        const _exhaustive: never = reaction.type;
        void _exhaustive;
        break;
      }
    }
  }, [reaction]);

  return (
    <div className={`lm-hero ${size === "lg" ? "lm-lg" : "lm-md"}`}>
      <div ref={mascotRef} className={`lm-mascot ${tilted ? "lm-tilt" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Pharmacy mascot" />
      </div>

      {/* key = message → bubble re-pops every time the text changes */}
      <div key={message} className="lm-bubble" aria-live="polite">
        {message}
      </div>

      <div ref={confettiRef} className="lm-confetti" />
    </div>
  );
}
