import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Log() {
  const navigate = useNavigate();
  const {
    profileCreated,
    loggedEntries, totalCalories, calorieTarget,
    isOverLimit, calorieProgress, remaining,
    addFood, removeFood,
  } = useApp();

  return (
    <div className="page log-page">
      <h2 className="page-title">Today's Log</h2>

      {!profileCreated ? (
        <div className="empty-card">
          <p>You need a profile to log your meals.</p>
          <button className="orange-btn" onClick={() => navigate("/profile")}>Set Up Profile</button>
        </div>
      ) : (
        <>
          {isOverLimit && (
            <div className="over-limit-banner">
              ⚠️ You're <strong>{Math.abs(remaining!)} kcal</strong> over your daily target!
            </div>
          )}

          {loggedEntries.length === 0 ? (
            <div className="empty-card">
              <p>Nothing logged yet.</p>
              <button className="orange-btn" onClick={() => navigate("/search")}>+ Log Food</button>
            </div>
          ) : (
            <>
              <div className="log-summary-card">
                <div className="log-summary-left">
                  <span className="log-total">{totalCalories.toLocaleString()}</span>
                  <span className="log-total-unit"> kcal logged</span>
                </div>
                {calorieTarget && (
                  <div className={`log-remaining${isOverLimit ? " over" : ""}`}>
                    {isOverLimit ? `${Math.abs(remaining!)} kcal over` : `${remaining} kcal left`}
                  </div>
                )}
              </div>

              {calorieTarget && (
                <div className="progress-bar-bg" style={{ marginBottom: 16 }}>
                  <div
                    className={`progress-bar-fill${isOverLimit ? " over" : ""}`}
                    style={{ width: `${calorieProgress}%` }}
                  />
                </div>
              )}

              <div className="meals-list">
                {loggedEntries.map(food => (
                  <div className="meal-row log-row" key={food.id}>
                    <div className="meal-dot" />
                    <div className="meal-info">
                      <div className="meal-name">{food.name}</div>
                      <div className="meal-canteen">{food.canteen}</div>
                    </div>
                    <div className="log-row-right">
                      <div className="qty-row compact">
                        <button className="qty-btn" onClick={() => removeFood(food.id)}>−</button>
                        <span className="qty-count">{food.count}</span>
                        <button className="qty-btn add" onClick={() => addFood(food.id)}>+</button>
                      </div>
                      <div className="meal-cal">
                        {(food.calories * food.count).toLocaleString()}
                        <span className="meal-cal-unit">kcal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="orange-btn" style={{ marginTop: 8 }} onClick={() => navigate("/search")}>
                + Add More
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
