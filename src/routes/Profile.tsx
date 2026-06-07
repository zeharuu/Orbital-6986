import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Profile() {
  const { profileCreated } = useApp();
  return profileCreated ? <ProfileView /> : <ProfileForm />;
}

function ProfileForm() {
  const {
    email, profilePrompt,
    name, setName, gender, setGender, age, setAge,
    height, setHeight, weight, setWeight, goal, setGoal,
    saveProfile,
  } = useApp();

  return (
    <div className="page profile-page">
      <h2 className="page-title">{profilePrompt ? "Profile Required" : "Create Profile"}</h2>

      {profilePrompt && (
        <div className="profile-prompt-notice">
          ⚠️ Height and weight are required to calculate your BMI and start logging food.
        </div>
      )}

      <div className="email-badge">
        <span className="email-badge-label">Signed in as</span>
        <span className="email-badge-value">{email}</span>
      </div>

      <div className="form-group">
        <label>Name</label>
        <input placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Age</label>
          <input placeholder="Years" value={age} onChange={e => setAge(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Gender</label>
          <select value={gender} onChange={e => setGender(e.target.value)}>
            <option>Female</option>
            <option>Male</option>
            <option>Prefer not to say</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Height (cm)</label>
          <input placeholder="e.g. 165" value={height} onChange={e => setHeight(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Weight (kg)</label>
          <input placeholder="e.g. 60" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Fitness Goal</label>
        <select value={goal} onChange={e => setGoal(e.target.value)}>
          <option>Lose weight</option>
          <option>Maintain weight</option>
          <option>Gain muscle</option>
        </select>
      </div>
      <button className="save-btn" onClick={saveProfile}>Save Profile</button>
    </div>
  );
}

function ProfileView() {
  const navigate = useNavigate();
  const {
    email, initials, name, gender, age, height, weight, goal,
    bmi, bmr, calorieTarget,
    totalCalories, calorieProgress, isOverLimit, remaining,
    editProfile, signOut,
  } = useApp();

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

      <button className="sign-out-btn" onClick={signOut}>Sign out</button>
    </div>
  );
}
