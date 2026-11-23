"use client";

/**
 * LoginMascot — mascot message for the LOGIN page.
 * Put it where the "Welcome back" <h1> was. Keep the "Sign in to continue..." line below it.
 *
 *   const [email, setEmail] = useState("");
 *   const [pwFocus, setPwFocus] = useState(false);
 *
 *   <LoginMascot email={email} passwordFocused={pwFocus} />
 *   <p>Sign in to continue to your account.</p>
 *   <input value={email} onChange={(e) => setEmail(e.target.value)} />
 *   <input type="password" onFocus={() => setPwFocus(true)} onBlur={() => setPwFocus(false)} />
 */

import { useEffect, useMemo, useState } from "react";
import MascotHero from "./MascotHero";

type Props = {
  email?: string;
  passwordFocused?: boolean;
  src?: string;
  cycleMs?: number;
};

// Edit / add roles. Key = word searched inside the email, value = message.
const ROLE_MESSAGES: Record<string, string> = {
  admin: "Hello Admin, how are you? 👋",
  pharmacist: "Hi Pharmacist, hope you're doing well! 💊",
  cashier: "Hello Cashier, ready for billing? 🧾",
};
const PASSWORD_MESSAGE = "Your password is safe with me 🔒";

function timeGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function LoginMascot({
  email = "",
  passwordFocused = false,
  src,
  cycleMs = 3400,
}: Props) {
  const [index, setIndex] = useState(0);
  const [greet, setGreet] = useState("Good day");
  useEffect(() => setGreet(timeGreeting()), []); // client only (no hydration mismatch)

  const defaults = useMemo(
    () => [
      "Welcome back! 👋",
      `${greet}! Good to see you 😊`,
      "Ready to run your pharmacy? 💊",
    ],
    [greet]
  );

  const roleMessage = useMemo(() => {
    const e = email.toLowerCase();
    const key = Object.keys(ROLE_MESSAGES).find((k) => e.includes(k));
    return key ? ROLE_MESSAGES[key] : null;
  }, [email]);

  const override = passwordFocused ? PASSWORD_MESSAGE : roleMessage;

  useEffect(() => {
    if (override) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % defaults.length), cycleMs);
    return () => clearInterval(id);
  }, [override, defaults.length, cycleMs]);

  return (
    <MascotHero
      size="lg"
      src={src}
      tilted={passwordFocused}
      message={override ?? defaults[index % defaults.length]}
    />
  );
}
