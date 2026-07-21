import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatDateSlash } from "../data";

export default function Profile() {
  const { emailConfirmed, profileCreated, stopGuestBrowsing } = useApp();
  if (!emailConfirmed) {
    return (
      <div className="page profile-page">
        <h2 className="page-title">Sign in required</h2>
        <div className="empty-card">
          <p>Sign in or create an account to set up your profile and log meals.</p>
          <button className="orange-btn" onClick={stopGuestBrowsing}>Sign in</button>
        </div>
      </div>
    );
  }
  return profileCreated ? <ProfileView /> : <ProfileForm />;
}

function ProfileForm() {
  const {
    email, profilePrompt, emailError,
    name, setName, gender, setGender, age, setAge,
    height, setHeight, weight, setWeight, goal, setGoal,
    useTargetMode, setUseTargetMode, targetBmi, setTargetBmi, targetDate, setTargetDate,
    saveProfile,
  } = useApp();
  const [saving, setSaving] = useState(false);
  const [targetWeightInput, setTargetWeightInput] = useState("");

  const handleTargetWeightChange = (value: string) => {
    setTargetWeightInput(value);
    const w = Number(value), h = Number(height) / 100;
    if (w > 0 && h > 0) setTargetBmi((w / (h * h)).toFixed(1));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page profile-page">
      <h2 className="page-title">{profilePrompt ? "Profile Required" : "Create Profile"}</h2>

      {profilePrompt && (
        <div className="profile-prompt-notice">
          Height and weight are required to calculate your BMI and start logging food.
        </div>
      )}

      <div className="email-badge">
        <span className="email-badge-label">Signed in as</span>
        <span className="email-badge-value">{email}</span>
      </div>

      <div className="form-group">
        <label>Name</label>
        <input placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} disabled={saving} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Age</label>
          <input placeholder="Years" value={age} onChange={e => setAge(e.target.value)} disabled={saving} />
        </div>
        <div className="form-group">
          <label>Gender</label>
          <select value={gender} onChange={e => setGender(e.target.value)} disabled={saving}>
            <option>Female</option>
            <option>Male</option>
            <option>Prefer not to say</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Height (cm)</label>
          <input placeholder="e.g. 165" value={height} onChange={e => setHeight(e.target.value)} disabled={saving} />
        </div>
        <div className="form-group">
          <label>Weight (kg)</label>
          <input placeholder="e.g. 60" value={weight} onChange={e => setWeight(e.target.value)} disabled={saving} />
        </div>
      </div>
      <div className="form-group">
        <label>Fitness Goal</label>
        <select value={goal} onChange={e => setGoal(e.target.value)} disabled={saving || useTargetMode}>
          <option>Lose weight</option>
          <option>Maintain weight</option>
          <option>Gain muscle</option>
        </select>
      </div>

      <button
        type="button"
        className={`target-mode-toggle${useTargetMode ? " active" : ""}`}
        onClick={() => setUseTargetMode(!useTargetMode)}
        disabled={saving}
        aria-pressed={useTargetMode}
      >
        <span className="target-mode-toggle-icon">🎯</span>
        {useTargetMode ? "Target BMI & Weight Added" : "Insert BMI and Target Weight"}
      </button>

      {useTargetMode && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Target BMI</label>
              <input className="target-input" placeholder="e.g. 20" value={targetBmi} onChange={e => setTargetBmi(e.target.value)} disabled={saving} />
            </div>
            <div className="form-group">
              <label>Or Target Weight (kg)</label>
              <input className="target-input" placeholder="e.g. 58" value={targetWeightInput} onChange={e => handleTargetWeightChange(e.target.value)} disabled={saving || !height} />
            </div>
          </div>
          <div className="form-group">
            <label>Reach it by</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} disabled={saving} />
          </div>
        </>
      )}

      {emailError && <p className="field-error">{emailError}</p>}
      <button className="save-btn" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}

function ProfileView() {
  const navigate = useNavigate();
  const {
    email, initials, name, gender, age, height, weight, goal,
    useTargetMode, setUseTargetMode, targetBmi, setTargetBmi, targetDate, setTargetDate,
    bmi, bmiCategory, recommendedGoal, bmr, calorieTarget,
    weightDiffKg, targetTimelineUnsafe, earliestSafeDate,
    totalCalories, calorieProgress, isOverLimit, remaining,
    editProfile, signOut, saveProfile,
  } = useApp();
  const [savingTarget, setSavingTarget] = useState(false);
  // Derived from the already-saved targetBmi/height (reversing the BMI formula), not
  // just "" - otherwise this field looks empty/unsaved on every remount even though
  // targetBmi itself persisted correctly.
  const [targetWeightInput, setTargetWeightInput] = useState(() => {
    const bmiNum = Number(targetBmi), heightM = Number(height) / 100;
    return bmiNum > 0 && heightM > 0 ? (bmiNum * heightM * heightM).toFixed(1) : "";
  });
  const [justSavedTarget, setJustSavedTarget] = useState(() => useTargetMode && !!targetBmi && !!targetDate);

  const handleTargetWeightChange = (value: string) => {
    setTargetWeightInput(value);
    const w = Number(value), h = Number(height) / 100;
    if (w > 0 && h > 0) setTargetBmi((w / (h * h)).toFixed(1));
  };

  const handleSaveTarget = async () => {
    setSavingTarget(true);
    try {
      // navigateAfter=false - stay on this page so the "Targets saved" confirmation
      // (and the target weight you just typed) is actually visible, instead of being
      // yanked to Home before you can see it stuck.
      await saveProfile(false);
      setJustSavedTarget(true);
    } finally {
      setSavingTarget(false);
    }
  };

  const toggleTargetMode = () => {
    setUseTargetMode(!useTargetMode);
    setJustSavedTarget(false);
  };

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info">
          <div className="profile-name">{name}</div>
          <div className="profile-email">{email}</div>
          <div className="profile-goal">{goal}</div>
        </div>
        <button className="edit-btn" onClick={editProfile}>Edit</button>
      </div>

      <button className="log-food-prominent" onClick={() => navigate("/search")}>
        <span className="lf-plus">+</span> Log Food
      </button>

      {isOverLimit && (
        <div className="over-limit-banner">
          ⚠️ You're <strong>{Math.abs(remaining!)} kcal</strong> over your daily target!
        </div>
      )}

      <div className="summary-grid">
        {[
          ["Age", age || "—"],
          ["Gender", gender],
          ["BMI", bmi ?? "—"],
          ["BMR", bmr ? `${Math.round(bmr)} kcal` : "—"],
          ["Height", height ? `${height} cm` : "—"],
          ["Weight", weight ? `${weight} kg` : "—"],
        ].map(([lbl, val]) => (
          <div className="stat-box" key={lbl}>
            <span className="stat-label">{lbl}</span>
            <span className="stat-value">{val}</span>
          </div>
        ))}
      </div>

      {!useTargetMode && bmiCategory && recommendedGoal && recommendedGoal !== goal && (
        <div className="profile-prompt-notice">
          Your BMI ({bmi}) falls in the <strong>{bmiCategory}</strong> range, you might consider switching your goal to <strong>{recommendedGoal}</strong>.
        </div>
      )}

      {useTargetMode && targetBmi && targetDate && (
        <div className={targetTimelineUnsafe ? "over-limit-banner" : "profile-prompt-notice"}>
          {targetTimelineUnsafe ? (
            <>
              ⚠️ Reaching BMI {targetBmi} by {formatDateSlash(targetDate)} would require an unsafe rate of change.
              We've capped your daily target at a safe limit instead
              {earliestSafeDate && <>, the earliest safe date for this goal is <strong>{formatDateSlash(earliestSafeDate)}</strong></>}.
            </>
          ) : (
            <>
              Targeting BMI <strong>{targetBmi}</strong> by <strong>{formatDateSlash(targetDate)}</strong>.
              {weightDiffKg !== null && (
                <> You have to {weightDiffKg < 0 ? "lose" : "gain"} about <strong>{Math.abs(weightDiffKg).toFixed(1)} kg</strong>.</>
              )}
            </>
          )}
        </div>
      )}

      {calorieTarget !== null && (
        <div className="calorie-tracker">
          <div className="ct-header">
            <span className="ct-title">Daily Target</span>
            <span className="ct-target">{calorieTarget} kcal</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className={`progress-bar-fill${isOverLimit ? " over" : ""}`}
              style={{ width: `${calorieProgress}%` }}
            />
          </div>
          <div className="ct-foot">
            <span>{totalCalories.toLocaleString()} kcal logged</span>
            <span className={isOverLimit ? "over-limit-text" : ""}>
              {remaining !== null
                ? remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over target`
                : ""}
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`target-mode-toggle${useTargetMode ? " active" : ""}`}
        onClick={toggleTargetMode}
        aria-pressed={useTargetMode}
      >
        <span className="target-mode-toggle-icon">🎯</span>
        {useTargetMode ? "Remove Targets" : "Insert Target BMI and Target Weight"}
      </button>

      {useTargetMode && (
        justSavedTarget ? (
          <div className="targets-saved-card">
            <div>
              <div>✓ Targets saved</div>
              <div className="targets-saved-detail">
                BMI {targetBmi}{targetWeightInput && ` (${targetWeightInput} kg)`} by {formatDateSlash(targetDate)}
              </div>
            </div>
            <button type="button" className="targets-saved-edit-btn" onClick={() => setJustSavedTarget(false)}>Edit</button>
          </div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Target BMI</label>
                <input className="target-input" placeholder="e.g. 20" value={targetBmi} onChange={e => setTargetBmi(e.target.value)} disabled={savingTarget} />
              </div>
              <div className="form-group">
                <label>Or Target Weight (kg)</label>
                <input className="target-input" placeholder="e.g. 58" value={targetWeightInput} onChange={e => handleTargetWeightChange(e.target.value)} disabled={savingTarget || !height} />
              </div>
            </div>
            <div className="form-group">
              <label>Reach it by</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} disabled={savingTarget} />
            </div>
            <button className="save-btn" onClick={handleSaveTarget} disabled={savingTarget}>
              {savingTarget ? "Saving..." : "Save Target"}
            </button>
          </>
        )
      )}

      <button className="sign-out-btn" onClick={signOut}>Sign out</button>
    </div>
  );
}
