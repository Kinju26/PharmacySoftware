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
        <svg viewBox="0 0 360 420" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="mlCross" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5fcf93" />
              <stop offset="1" stopColor="#2e9e6a" />
            </linearGradient>
            <linearGradient id="mlWhite" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e3ecf2" />
            </linearGradient>
            <linearGradient id="mlBlue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#4f8fe0" />
              <stop offset="1" stopColor="#2a5fae" />
            </linearGradient>
            <clipPath id="mlClipR">
              <rect x="212" y="118" width="112" height="208" rx="56" />
            </clipPath>
          </defs>
          <g className="cross">
            <path d="M140 42h80v70h70v80h-70v70h-80v-70H70v-80h70z" fill="url(#mlCross)" opacity=".95" />
            <path
              d="M140 42h80v70h70v80h-70v70h-80v-70H70v-80h70z"
              fill="none"
              stroke="#ffffff"
              strokeOpacity=".18"
              strokeWidth="2"
            />
          </g>
          <ellipse className="shadow" cx="180" cy="372" rx="120" ry="12" fill="#000" />
          <g transform="translate(-88 0)">
            <g className="bob bob2">
              <rect x="212" y="118" width="112" height="208" rx="56" fill="url(#mlWhite)" />
              <rect x="212" y="226" width="112" height="100" fill="url(#mlBlue)" clipPath="url(#mlClipR)" />
              <line x1="212" y1="226" x2="324" y2="226" stroke="#ffffff" strokeOpacity=".5" strokeWidth="2" />
              <circle cx="246" cy="186" r="6" fill="#183247" />
              <circle cx="290" cy="186" r="6" fill="#183247" />
              <circle cx="240" cy="204" r="6" fill="#9cc3f2" opacity=".7" />
              <circle cx="296" cy="204" r="6" fill="#9cc3f2" opacity=".7" />
              <path d="M250 202 Q268 220 286 202" fill="none" stroke="#183247" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M254 280h10v-10h8v10h10v8h-10v10h-8v-10h-10z" fill="#ffffff" opacity=".9" />
              <path
                className="wave"
                style={{ animationDelay: "-.6s" }}
                d="M322 262 Q344 240 332 214"
                fill="none"
                stroke="#183247"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path d="M212 268 Q196 262 190 246" fill="none" stroke="#183247" strokeWidth="6" strokeLinecap="round" />
              <path d="M250 326 L244 360 M290 326 L296 360" stroke="#183247" strokeWidth="6" strokeLinecap="round" />
            </g>
          </g>
        </svg>
        <div className="track">
          <i />
        </div>
      </div>
    </div>
  );
}
