"use client";

/**
 * useSignupMascot — all the mascot "reactions" for the SIGN UP page.
 * You call the small handlers from your inputs; the hook gives back
 * `message` + `reaction` for <MascotHero />.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Reaction } from "./MascotHero";

export function passwordScore(v: string) {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s; // 0..4
}
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const firstName = (v: string) => v.trim().split(/\s+/)[0] || "friend";

const HOVER: Record<string, string> = {
  facebook: "Sign up with Facebook? 👍",
  google: "Quick sign up with Google? 🚀",
  apple: "Sign up with Apple? 🍎",
  terms: "Your data is safe with us 🔒",
};

export function useSignupMascot() {
  const [message, setMessage] = useState("Hi there! Let's create your account 👋");
  const [reaction, setReaction] = useState<Reaction>(null);

  const values = useRef({ name: "", email: "", password: "" });
  const locked = useRef(false);
  const last = useRef(0);
  const defaultsRef = useRef<string[]>([]);
  const di = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const say = useCallback((text: string, type?: NonNullable<Reaction>["type"]) => {
    setMessage(text);
    last.current = Date.now();
    if (type) setReaction({ type, id: Date.now() + Math.random() });
  }, []);

  const done = () => {
    const v = values.current;
    return (
      (v.name.trim().length >= 2 ? 1 : 0) +
      (isEmail(v.email) ? 1 : 0) +
      (passwordScore(v.password) >= 3 ? 1 : 0)
    );
  };
  const debounce = (k: string, fn: () => void, ms: number) => {
    clearTimeout(timers.current[k]);
    timers.current[k] = setTimeout(fn, ms);
  };

  // idle messages (client only)
  useEffect(() => {
    const h = new Date().getHours();
    const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    defaultsRef.current = [
      "Hi there! Let's create your account 👋",
      `${g}! It only takes a minute ⏱️`,
      "Your data is safe with us 🔒",
    ];
    const id = setInterval(() => {
      const a = document.activeElement;
      if (locked.current || (a && a.tagName === "INPUT")) return;
      if (Date.now() - last.current > 5000) {
        di.current = (di.current + 1) % defaultsRef.current.length;
        say(defaultsRef.current[di.current]);
      }
    }, 1500);
    return () => clearInterval(id);
  }, [say]);

  // ---------- name ----------
  const afterName = () => {
    if (locked.current) return;
    if (values.current.name.trim().length >= 2)
      say(`Nice to meet you, ${firstName(values.current.name)}! 👋`, "wave");
  };
  const onNameChange = (v: string) => {
    values.current.name = v;
    debounce("n", afterName, 900);
  };
  const onNameBlur = () => {
    clearTimeout(timers.current.n);
    afterName();
  };
  const onNameFocus = () => {
    if (!values.current.name && !locked.current) say("What should I call you? 😊");
  };

  // ---------- email ----------
  const afterEmail = (blur: boolean) => {
    if (locked.current) return;
    const v = values.current.email.trim();
    if (!v) return;
    if (isEmail(v)) {
      const d = done();
      say(d >= 2 ? `Looks good ✅ ${d} of 3 done, almost there! 🚀` : "Looks good ✅");
    } else if (blur) {
      say("Hmm, that email looks incomplete 🤔", "shake");
    }
  };
  const onEmailChange = (v: string) => {
    values.current.email = v;
    debounce("e", () => afterEmail(false), 1100);
  };
  const onEmailBlur = () => {
    clearTimeout(timers.current.e);
    afterEmail(true);
  };
  const onEmailFocus = () => {
    if (!values.current.email && !locked.current) say("Don't worry, your email stays private ✉️");
  };

  // ---------- password ----------
  const afterPassword = () => {
    if (locked.current) return;
    const v = values.current.password;
    if (!v) return say("Pick a strong password 🔐");
    const s = passwordScore(v);
    const all = done() === 3;
    if (s <= 1) say("Make it stronger. Add numbers or symbols 💪");
    else if (s === 2) say("Getting better! Add a symbol or a number 👍");
    else if (s === 3) say(all ? "Strong password! You're all set 🚀" : "Almost there! 👍");
    else say(all ? "Super strong password! 🛡️ You're ready to go!" : "Super strong password! 🛡️", "jump");
  };
  const onPasswordChange = (v: string) => {
    values.current.password = v;
    debounce("p", afterPassword, 200);
  };
  const onPasswordFocus = () => {
    if (!values.current.password && !locked.current) say("Pick a strong password 🔐");
  };

  // ---------- hover (social buttons / terms) ----------
  const onHover = (key: "facebook" | "google" | "apple" | "terms") => {
    if (!locked.current) say(HOVER[key]);
  };

  // ---------- submit ----------
  /** Call before your API request. Returns true if everything looks fine. */
  const validate = (v: { name: string; email: string; password: string }) => {
    values.current = { ...v };
    if (v.name.trim().length < 2) {
      say("Please tell me your name first 😊", "shake");
      return false;
    }
    if (!isEmail(v.email)) {
      say("Please enter a valid email ✉️", "shake");
      return false;
    }
    if (passwordScore(v.password) < 2) {
      say("Let's make the password stronger first 💪", "shake");
      return false;
    }
    return true;
  };
  /** Call after the API says the account was created. */
  const celebrate = (name: string) => {
    locked.current = true;
    say(`Welcome to the team, ${firstName(name)}! 🎉`, "celebrate");
  };
  /** Call when the API returns an error (e.g. email already registered). */
  const fail = (text: string) => say(text, "shake");

  return {
    message,
    reaction,
    onNameChange,
    onNameBlur,
    onNameFocus,
    onEmailChange,
    onEmailBlur,
    onEmailFocus,
    onPasswordChange,
    onPasswordFocus,
    onHover,
    validate,
    celebrate,
    fail,
  };
}
