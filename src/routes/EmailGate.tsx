import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function EmailGate() {
  const { emailInput, setEmailInput, emailError, confirmEmail, authLoading } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await confirmEmail();
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
          Enter your email to track your nutrition journey. Returning users will have
          their profile loaded automatically.
        </p>
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
          {emailError && <p className="field-error">{emailError}</p>}
        </div>
        <button className="save-btn" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Get Started →"}
        </button>
      </div>
    </div>
  );
}
