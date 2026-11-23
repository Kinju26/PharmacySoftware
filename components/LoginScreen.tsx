"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeClosedIcon, EyeOpenIcon } from "@/components/icons";
import LoginMascot from "@/components/LoginMascot";
import {
  clearFailedAttempts,
  createOtp,
  getRememberedEmail,
  lockoutMessage,
  recordFailedAttempt,
  verifyOtp,
} from "@/lib/auth-security";
import { usePharmacy } from "@/context/PharmacyContext";

type Step = "credentials" | "otp" | "location";

export function LoginScreen() {
  const { ready, currentUser, verifyCredentials, completeLogin, branchNames, setSelectedBranches, showToast } =
    usePharmacy();
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [loginMsg, setLoginMsg] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [otp, setOtp] = useState("");
  const [location, setLocation] = useState("");

  const multiLocation = branchNames.length > 1;

  useEffect(() => {
    const remembered = getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (ready && currentUser) router.replace("/dashboard");
  }, [currentUser, ready, router]);

  useEffect(() => {
    if (branchNames.length && !location) setLocation(branchNames[0]);
  }, [branchNames, location]);

  const subtitle = useMemo(() => {
    switch (step) {
      case "credentials":
        return "Sign in to continue to your account.";
      case "otp":
        return "Enter the 6-digit verification code sent to your email.";
      case "location":
        return "Select the pharmacy location you are working at today.";
      default: {
        const _exhaustive: never = step;
        return _exhaustive;
      }
    }
  }, [step]);

  function finishLogin() {
    if (location) setSelectedBranches([location]);
    else if (branchNames.length === 1) setSelectedBranches([branchNames[0]]);
    completeLogin(email, { remember });
    router.push("/dashboard");
  }

  function onCredentials(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const locked = lockoutMessage();
    if (locked) {
      setLoginMsg(locked);
      return;
    }
    const err = verifyCredentials(email, password);
    if (err) {
      setLoginMsg(recordFailedAttempt());
      return;
    }
    clearFailedAttempts();
    const code = createOtp(email);
    showToast(`Verification code: ${code}`);
    setLoginMsg(`Demo code: ${code}`);
    setOtp("");
    setStep("otp");
  }

  function onOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      setLoginMsg("Enter the 6-digit verification code.");
      return;
    }
    if (!verifyOtp(email, otp)) {
      setLoginMsg("Invalid or expired code. Please try again.");
      return;
    }
    setLoginMsg("");
    if (multiLocation) {
      setStep("location");
      return;
    }
    finishLogin();
  }

  function onLocation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!location) {
      setLoginMsg("Please select a pharmacy location.");
      return;
    }
    setLoginMsg("");
    finishLogin();
  }

  return (
    <div className="login-host" aria-label="Sign in">
      <main className="card" data-mode="login">
        <div className="card-bg" aria-hidden="true">
          <div className="doc-stage" aria-hidden="true">
            <div className="doc-in">
              <div className="doc-figure">
                <img alt="" src="/images/login-mascot.webp?v=8" />
              </div>
            </div>
            <div className="doc-desk" />
            <div className="doc-bubble">
              Good to see you <i>👋</i>
            </div>
          </div>
        </div>

        <section className="hero login" aria-label="Staff notice">
          <h2>Authorized pharmacy staff only</h2>
          <p>Staff accounts are created by Admin invite. All activity is logged.</p>
        </section>

        <section className="form login" aria-label="Sign in">
          <div className="form-inner">
            <LoginMascot email={email} passwordFocused={pwFocus && step === "credentials"} src="/mascot.png?v=2" />
            <p className="subtitle">{subtitle}</p>

            {step === "credentials" && (
              <form onSubmit={onCredentials} noValidate>
                <div className="field">
                  <label htmlFor="loginEmail">User ID / Email</label>
                  <input
                    id="loginEmail"
                    name="email"
                    type="text"
                    autoComplete="username"
                    placeholder="you@pharmacy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPwFocus(true)}
                      onBlur={() => setPwFocus(false)}
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
                    <input
                      type="checkbox"
                      name="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />{" "}
                    Remember this device for 7 days
                  </label>
                  <a
                    href="#"
                    className="link"
                    onClick={(e) => {
                      e.preventDefault();
                      setLoginMsg("Contact your admin for a reset link. Reset links expire quickly.");
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <button className="primary" type="submit">
                  Sign In
                </button>
                <div className="message" aria-live="polite">
                  {loginMsg}
                </div>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={onOtp} noValidate>
                <div className="field">
                  <label htmlFor="loginOtp">Verification code</label>
                  <input
                    id="loginOtp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <button className="primary" type="submit">
                  Verify code
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setStep("credentials");
                    setOtp("");
                    setLoginMsg("");
                  }}
                >
                  Back to sign in
                </button>
                <div className="message" aria-live="polite">
                  {loginMsg}
                </div>
              </form>
            )}

            {step === "location" && (
              <form onSubmit={onLocation} noValidate>
                <div className="field">
                  <label htmlFor="loginLocation">Pharmacy location</label>
                  <select
                    id="loginLocation"
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    {branchNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="primary" type="submit">
                  Continue
                </button>
                <div className="message" aria-live="polite">
                  {loginMsg}
                </div>
              </form>
            )}

            <p className="auth-notice">Authorized users only. Activity is logged.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
