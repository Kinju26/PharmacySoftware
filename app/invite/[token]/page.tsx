"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EyeClosedIcon, EyeOpenIcon } from "@/components/icons";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/messages";
import { usePharmacy } from "@/context/PharmacyContext";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = String(params.token || "");
  const router = useRouter();
  const { setSessionUser } = usePharmacy();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [challengeId, setChallengeId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/invite/accept?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Invite is invalid or expired.");
          return;
        }
        if (!cancelled) {
          setEmail(data.email || "");
          setName(data.name || "");
        }
      } catch {
        if (!cancelled) setError("Could not load invite.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onPassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "password", token, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not accept invite.");
        return;
      }
      setChallengeId(data.challengeId || "");
      setQrDataUrl(data.qrDataUrl || "");
      setPassword("");
      setStep("mfa");
    } catch {
      setError("Could not accept invite.");
    } finally {
      setBusy(false);
    }
  }

  async function onMfa(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "mfa", token, challengeId, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setError(data.error || "Invalid MFA code.");
        return;
      }
      setSessionUser(data.user.email);
      router.replace("/dashboard");
    } catch {
      setError("Could not verify MFA.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-host" aria-label="Accept invite">
      <main className="card" data-mode="login">
        <div className="card-bg" aria-hidden="true" />
        <section className="hero login" aria-label="Invite">
          <h2>Staff invite</h2>
          <p>Set a strong password and enable authenticator MFA to finish setup.</p>
        </section>
        <section className="form login" aria-label="Accept invite form">
          <div className="form-inner">
            <h1 style={{ margin: "0 0 6px", fontSize: 24 }}>Join pharmacy staff</h1>
            {loading ? <p className="subtitle">Checking invite…</p> : null}
            {!loading && error && step === "password" && !email ? (
              <p className="message">{error}</p>
            ) : null}

            {!loading && email && step === "password" ? (
              <form onSubmit={onPassword} noValidate>
                <p className="subtitle">
                  Invited as <b>{email}</b>. Password must be at least {PASSWORD_MIN_LENGTH} characters
                  with upper, lower, number, and symbol.
                </p>
                <div className="field">
                  <label htmlFor="inviteName">Full name</label>
                  <input id="inviteName" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field password-field">
                  <label htmlFor="invitePassword">Password</label>
                  <div className="input-wrap">
                    <input
                      id="invitePassword"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      className="eye"
                      type="button"
                      aria-label={showPass ? "Hide password" : "Show password"}
                      onClick={() => setShowPass((v) => !v)}
                    >
                      {showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>
                <button className="primary" type="submit" disabled={busy}>
                  Continue to MFA setup
                </button>
                <div className="message">{error}</div>
              </form>
            ) : null}

            {step === "mfa" ? (
              <form onSubmit={onMfa} noValidate>
                <p className="subtitle">Scan this QR code, then enter the 6-digit code.</p>
                {qrDataUrl ? (
                  <div className="mfa-qr-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="mfa-qr" src={qrDataUrl} alt="Authenticator QR code" />
                  </div>
                ) : null}
                <div className="field">
                  <label htmlFor="inviteOtp">Authenticator code</label>
                  <input
                    id="inviteOtp"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    required
                  />
                </div>
                <button className="primary" type="submit" disabled={busy}>
                  Finish setup
                </button>
                <div className="message">{error}</div>
              </form>
            ) : null}

            <p className="auth-notice">Authorized users only. Activity is logged.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
