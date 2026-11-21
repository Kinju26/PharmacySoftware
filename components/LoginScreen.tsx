"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppleIcon, EyeClosedIcon, EyeOpenIcon, FacebookIcon, GoogleIcon } from "@/components/icons";
import { usePharmacy } from "@/context/PharmacyContext";

type Mode = "login" | "register";

export function LoginScreen() {
  const { ready, currentUser, login, register } = usePharmacy();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loginMsg, setLoginMsg] = useState("");
  const [registerMsg, setRegisterMsg] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegisterPass, setShowRegisterPass] = useState(false);

  useEffect(() => {
    if (ready && currentUser) router.replace("/dashboard");
  }, [currentUser, ready, router]);

  function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const err = login(email, password);
    if (err) {
      setLoginMsg(err);
      return;
    }
    setLoginMsg("");
    router.push("/dashboard");
  }

  function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const err = register(name, email, password);
    if (err) {
      setRegisterMsg(err);
      return;
    }
    form.reset();
    setRegisterMsg("");
    setMode("login");
    setLoginMsg("Account created. Please sign in.");
  }

  return (
    <div className="login-host" aria-label="Sign in">
      <main className={`card ${mode === "register" ? "register" : ""}`} data-mode={mode}>
        <div className="card-bg" aria-hidden="true">
          <div className="doc-stage" aria-hidden="true">
            <div className="doc-in">
              <div className="doc-figure">
                <img alt="" src="/images/login-mascot.webp" />
              </div>
            </div>
            <div className="doc-desk" />
            <div className="doc-bubble">
              Good to see you <i>👋</i>
            </div>
          </div>
        </div>

        <section className="hero register" aria-label="Existing account">
          <h2>Welcome back</h2>
          <p>Login to review your account and continue your journey.</p>
          <button type="button" className="switch" onClick={() => setMode("login")}>
            Login
          </button>
        </section>

        <section className="form register" aria-label="Create account">
          <div className="form-inner">
            <h1>Create account</h1>
            <p className="subtitle">Create your account and begin your journey.</p>
            <form onSubmit={onRegister}>
              <div className="field">
                <label htmlFor="registerName">Full name</label>
                <input id="registerName" name="name" type="text" autoComplete="name" placeholder="Your name" required />
              </div>
              <div className="field">
                <label htmlFor="registerEmail">Email</label>
                <input
                  id="registerEmail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="field password-field">
                <label htmlFor="registerPassword">Password</label>
                <div className="input-wrap">
                  <input
                    id="registerPassword"
                    name="password"
                    type={showRegisterPass ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    minLength={4}
                    required
                  />
                  <button
                    className="eye"
                    type="button"
                    aria-label={showRegisterPass ? "Hide password" : "Show password"}
                    onClick={() => setShowRegisterPass((v) => !v)}
                  >
                    {showRegisterPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
              </div>
              <button className="primary" type="submit">
                Create account
              </button>
              <div className="message" aria-live="polite">
                {registerMsg}
              </div>
            </form>
            <div className="or">Or Sign up with</div>
            <div className="socials">
              <button type="button" className="social-btn" aria-label="Sign up with Facebook" onClick={() => setRegisterMsg("Demo register with Facebook.")}>
                <FacebookIcon />
              </button>
              <button type="button" className="social-btn" aria-label="Sign up with Google" onClick={() => setRegisterMsg("Demo register with Google.")}>
                <GoogleIcon />
              </button>
              <button type="button" className="social-btn" aria-label="Sign up with Apple" onClick={() => setRegisterMsg("Demo register with Apple.")}>
                <AppleIcon />
              </button>
            </div>
            <p className="terms">By creating an account, you agree to the terms and privacy policy.</p>
          </div>
        </section>

        <section className="hero login" aria-label="New user">
          <h2>Hello there</h2>
          <p>Begin your journey with us and discover something new.</p>
          <button type="button" className="switch" onClick={() => setMode("register")}>
            Sign Up
          </button>
        </section>

        <section className="form login" aria-label="Sign in">
          <div className="form-inner">
            <h1>Welcome back</h1>
            <p className="subtitle">Sign in to continue to your account.</p>
            <form onSubmit={onLogin} noValidate>
              <div className="field">
                <label htmlFor="loginEmail">User ID / Email</label>
                <input
                  id="loginEmail"
                  name="email"
                  type="text"
                  autoComplete="username"
                  placeholder="admin@kinjal.com"
                />
              </div>
              <div className="field password-field">
                <label htmlFor="loginPassword">Password</label>
                <div className="input-wrap">
                  <input
                    id="loginPassword"
                    name="password"
                    type={showLoginPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button
                    className="eye"
                    type="button"
                    aria-label={showLoginPass ? "Hide password" : "Show password"}
                    onClick={() => setShowLoginPass((v) => !v)}
                  >
                    {showLoginPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
              </div>
              <div className="form-row">
                <label className="remember">
                  <input type="checkbox" name="remember" /> Remember me
                </label>
                <a
                  href="#"
                  className="link"
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginMsg("Please contact the admin to reset your password.");
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <button className="primary" type="submit">
                Sign In to Master Admin
              </button>
              <div className="message" aria-live="polite">
                {loginMsg}
              </div>
            </form>
            <div className="or">Or Sign in with</div>
            <div className="socials">
              <button type="button" className="social-btn" aria-label="Sign in with Facebook" onClick={() => setLoginMsg("Demo login with Facebook.")}>
                <FacebookIcon />
              </button>
              <button type="button" className="social-btn" aria-label="Sign in with Google" onClick={() => setLoginMsg("Demo login with Google.")}>
                <GoogleIcon />
              </button>
              <button type="button" className="social-btn" aria-label="Sign in with Apple" onClick={() => setLoginMsg("Demo login with Apple.")}>
                <AppleIcon />
              </button>
            </div>
            <div
              className="login-foot"
              style={{ textAlign: "center", fontSize: "clamp(7px,1.4vw,9px)", color: "#9aa7b1", marginTop: 12 }}
            >
              Demo access: <b>admin@kinjal.com</b> / <b>admin</b>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
