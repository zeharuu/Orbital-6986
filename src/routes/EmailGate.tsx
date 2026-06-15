import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function EmailGate() {
  const {
    emailInput,
    setEmailInput,
    emailError,
    signInWithPassword,
    createAccountWithPassword,
    signInWithGoogle,
    startGuestBrowsing,
    authLoading,
  } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signInWithPassword(passwordInput);
      } else {
        await createAccountWithPassword(passwordInput);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="email-gate">
        <img src="/favicon.svg" alt="NutriNUS" className="gate-logo" />
        <div className="gate-title">Nutri<span className="brand-nus">NUS</span></div>
        <div className="gate-sub">Your NUS food companion</div>
        <div className="gate-card">
          <p style={{ textAlign: "center", color: "#8899aa" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-gate">
      <img src="/favicon.svg" alt="NutriNUS" className="gate-logo" />
      <div className="gate-title">Nutri<span className="brand-nus">NUS</span></div>
      <div className="gate-sub">Your NUS food companion</div>

      <div className="gate-card">
        <h2 className="gate-heading">Welcome!</h2>
        <p className="gate-desc">
          Sign in to track your nutrition journey. New users can create an account in seconds.
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            className={`auth-tab${mode === "sign-in" ? " active" : ""}`}
            onClick={() => setMode("sign-in")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`auth-tab${mode === "create" ? " active" : ""}`}
            onClick={() => setMode("create")}
            type="button"
          >
            Create account
          </button>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="e.g. e1234567@u.nus.edu"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder={mode === "create" ? "At least 6 characters" : "Your password"}
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            disabled={isSubmitting}
          />
          {emailError && <p className="field-error">{emailError}</p>}
        </div>

        <button className="save-btn" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>

        <div className="auth-divider"><span>or</span></div>

        <button className="google-btn" onClick={handleGoogleSignIn} disabled={isSubmitting} type="button">
          <span className="google-mark">G</span>
          Continue with Google
        </button>

        <button className="guest-browse-btn" onClick={startGuestBrowsing} disabled={isSubmitting} type="button">
          Browse food without signing in
        </button>
      </div>
    </div>
  );
}
