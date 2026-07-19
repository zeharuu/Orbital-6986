import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useChallenges } from "../context/ChallengesContext";
import { getGreeting, formatDateSlash } from "../data";

export default function Home() {
  const navigate = useNavigate();
  const {
    email, name, initials,
    profileCreated,
    isOverLimit, remaining,
    calorieTarget, totalCalories, calorieProgress,
    totalCarbs, totalProtein, totalFat,
    loggedEntries, streakDays, foodItems, addFood,
    useTargetMode, targetBmi, targetDate, weightDiffKg, targetTimelineUnsafe, earliestSafeDate,
    bmi, bmiCategory, recommendedGoal, goal,
  } = useApp();
  const { points } = useChallenges();

  const radius = 46;
  const [suggestionSeed, setSuggestionSeed] = useState(() => Date.now());
  const hasEstimatedEntry = loggedEntries.some(f => f.protein <= 0 && f.carbs <= 0 && f.fat <= 0);

  const suggestions = useMemo(() => {
    if (!profileCreated || remaining === null || remaining <= 0) return [];
    const eligible = foodItems.filter(f => f.calories <= remaining);
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [foodItems, remaining, profileCreated, suggestionSeed]);
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (calorieProgress / 100) * circumference;

  return (
    <div className="page home-page">
      {/* Brand */}
      <div className="brand-row">
        <img src="/favicon.svg" alt="NutriNUS" className="brand-logo" />
        <div className="brand-text">
          <span className="brand-name">Nutri<span className="brand-nus">NUS</span></span>
          <span className="brand-tagline">Your NUS food companion</span>
        </div>
      </div>

      {/* Greeting */}
      <div className="home-header">
        <div>
          <span className="greeting-sub">{getGreeting()},</span>
          <div className="greeting-name">
            {name || email.split("@")[0]} <span className="name-accent">• {initials}</span>
          </div>
        </div>
        <button className="points-badge" onClick={() => navigate("/challenges")} title="View Challenges">
          <span className="points-badge-icon">🍡</span>
          <span className="points-badge-value">{points.toLocaleString()}</span>
        </button>
      </div>

      {/* Profile nudge */}
      {!profileCreated && (
        <div className="nudge-card">
          <span className="nudge-icon">👤</span>
          <div className="nudge-body">
            <div className="nudge-title">Set up your profile</div>
            <div className="nudge-desc">Browse food anytime. Add a profile when you want to log meals.</div>
          </div>
          <div className="nudge-actions">
            <button className="nudge-secondary-btn" onClick={() => navigate("/search")}>Browse</button>
            <button className="nudge-btn" onClick={() => navigate("/profile")}>Set Up</button>
          </div>
        </div>
      )}

      {/* Over-limit banner */}
      {isOverLimit && profileCreated && (
        <div className="over-limit-banner">
          ⚠️ You've exceeded your daily target by <strong>{Math.abs(remaining!).toLocaleString()} kcal</strong>!
        </div>
      )}

      {/* Calories + ring + macros, combined into one panel */}
      {profileCreated && (
        <>
          <div className={`calories-card${isOverLimit ? " over" : ""}`}>
            <div className="calories-card-top">
              <div className="calories-left">
                <div className="calories-label">TODAY'S CALORIES</div>
                <div className={`calories-value${isOverLimit ? " over" : ""}`}>
                  {totalCalories.toLocaleString()}
                </div>
                {calorieTarget && (
                  <div className="calories-sub">
                    {isOverLimit
                      ? `${Math.abs(remaining!)} kcal over target`
                      : `at ${calorieTarget.toLocaleString()} kcal target`}
                  </div>
                )}
              </div>
              <svg viewBox="0 0 110 110" width="88" height="88" className="cal-ring">
                <circle cx="55" cy="55" r={radius} fill="none" stroke="#dce8f5" strokeWidth="9" />
                <circle
                  cx="55" cy="55" r={radius} fill="none"
                  stroke={isOverLimit ? "#e53e3e" : "#f47c20"} strokeWidth="9"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                />
                <text x="55" y="60" textAnchor="middle" fill={isOverLimit ? "#e53e3e" : "#003D7C"}
                  fontSize="15" fontWeight="700" fontFamily="Inter,sans-serif">
                  {Math.round(calorieProgress)}%
                </text>
              </svg>
            </div>

            {hasEstimatedEntry && <div className="estimated-nutrition-notice">Estimated</div>}
            <div className="macros-row inline">
              {[
                { val: `${totalCarbs}g`, lbl: "Carbs" },
                { val: `${totalProtein}g`, lbl: "Protein" },
                { val: `${totalFat}g`, lbl: "Fats" },
              ].map(({ val, lbl }) => (
                <div className="macro-item" key={lbl}>
                  <span className="macro-val">{val}</span>
                  <span className="macro-lbl">{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="targets-panel">
            <div className="targets-panel-title">🎯 Personalised Target</div>
            {useTargetMode && targetBmi && targetDate ? (
              targetTimelineUnsafe ? (
                <div className="targets-panel-text warn">
                  ⚠️ Reaching BMI {targetBmi} by {formatDateSlash(targetDate)} needs an unsafe rate of change, capped at a safe daily limit
                  {earliestSafeDate && <>. Earliest safe date: <strong>{formatDateSlash(earliestSafeDate)}</strong></>}.
                </div>
              ) : (
                <div className="targets-panel-text">
                  Targeting BMI <strong>{targetBmi}</strong> by <strong>{formatDateSlash(targetDate)}</strong>.
                  {weightDiffKg !== null && (
                    <> You have to {weightDiffKg < 0 ? "lose" : "gain"} about <strong>{Math.abs(weightDiffKg).toFixed(1)} kg</strong>.</>
                  )}
                </div>
              )
            ) : bmiCategory && recommendedGoal && recommendedGoal !== goal ? (
              <div className="targets-panel-text">
                Your BMI ({bmi}) is in the <strong>{bmiCategory}</strong> range, consider switching your goal to <strong>{recommendedGoal}</strong>.
              </div>
            ) : (
              <div className="targets-panel-text muted">
                No target set yet.{" "}
                <button type="button" className="targets-panel-link" onClick={() => navigate("/profile")}>
                  Set a target BMI
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Today's Meals */}
      <div className="section-header">
        <span className="section-title">Today's Meals</span>
        {loggedEntries.length > 3 ? (
          <button className="see-all-btn" onClick={() => navigate("/log")}>SEE ALL</button>
        ) : loggedEntries.length > 0 ? (
          <span className="see-all-done">All displayed ✓</span>
        ) : null}
      </div>

      {!profileCreated ? (
        <div className="empty-card">
          <p>You can browse meals before setting up your profile.</p>
          <button className="orange-btn" onClick={() => navigate("/search")}>Browse Food</button>
        </div>
      ) : loggedEntries.length === 0 ? (
        <div className="empty-card">
          <p>No meals logged yet.</p>
          <button className="orange-btn" onClick={() => navigate("/search")}>+ Log Food</button>
        </div>
      ) : (
        <div className="meals-list">
          {loggedEntries.slice(0, 3).map(food => (
            <div className="meal-row" key={food.id}>
              <div className="meal-dot" />
              <div className="meal-info">
                <div className="meal-name">
                  {food.name}
                  {food.count > 1 && <span className="meal-qty"> ×{food.count}</span>}
                </div>
                <div className="meal-canteen">{food.canteen}, {food.stall.split(" - ")[0]}</div>
              </div>
              <div className="meal-cal">
                {(food.calories * food.count).toLocaleString()}
                <span className="meal-cal-unit">kcal</span>
              </div>
            </div>
          ))}
          {loggedEntries.length > 3 && (
            <button className="show-more-btn" onClick={() => navigate("/log")}>
              +{loggedEntries.length - 3} more, view all
            </button>
          )}
        </div>
      )}

      {/* Streak */}
      <div className="streak-card">
        <span className="streak-icon">🔥</span>
        <div>
          <div className="streak-title">
            {streakDays === 0 ? "Start your streak!"
              : streakDays === 1 ? "Day 1, great start!"
              : `${streakDays}-Day Streak!`}
          </div>
          <div className="streak-sub">
            {streakDays === 0 ? "Log food today to begin" : "Keep logging daily to maintain it"}
          </div>
        </div>
      </div>

      {/* Suggested Meals */}
      {profileCreated && suggestions.length > 0 && (
        <div className="suggestions-section" style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: "16px", paddingTop:"16px"}}>
          <div className="section-header">
            <span className="section-title">Suggested For You</span>
            <button
              className="see-all-btn"
              onClick={() => setSuggestionSeed(Date.now())}
              style={{ fontSize: "0.75rem", padding: "4px 10px" }}
            >
              SHUFFLE 🔀
            </button>
          </div>
          <div className="meals-list">
            {suggestions.map(food => (
              <div className="meal-row" key={food.id}>
                <button
                  className="orange-btn"
                  style={{ fontSize: "0.7rem", padding: "4px 8px", minWidth: "fit-content", whiteSpace: "nowrap" }}
                  onClick={() => addFood(food.id)}
                >
                  + Add
                </button>
                <div className="meal-info">
                  <div className="meal-name">{food.name}</div>
                  <div className="meal-canteen">{food.canteen}, {food.stall.split(" - ")[0]}</div>
                </div>
                <div className="meal-cal">
                  {food.calories.toLocaleString()}
                  <span className="meal-cal-unit">kcal</span>
                </div>
              </div>
            ))}
          </div>
        </div>  
      )}      
    </div>
  );
}