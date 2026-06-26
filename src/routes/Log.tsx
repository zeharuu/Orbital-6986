import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function Log() {
  const navigate = useNavigate();
  const {
    emailConfirmed, stopGuestBrowsing,
    profileCreated,
    loggedEntries, totalCalories, calorieTarget,
    isOverLimit, calorieProgress, remaining,
    addFood, removeFood,
    logHistory, foodItems,
  } = useApp();

  const today = new Date().toDateString();

  const pastDays = Object.entries(logHistory)
    .filter(([date]) => date !== today)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="page log-page">
      <h2 className="page-title">Today's Log</h2>

      {!profileCreated ? (
        <div className="empty-card">
          <p>{emailConfirmed ? "You need a profile to log your meals." : "Sign in to create a profile and log meals."}</p>
          <button
            className="orange-btn"
            onClick={() => emailConfirmed ? navigate("/profile") : stopGuestBrowsing()}
          >
            {emailConfirmed ? "Set Up Profile" : "Sign in"}
          </button>
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

          {pastDays.length > 0 && (
            <div className="history-section">
              <h3 className="history-title">Past Days</h3>
              {pastDays.map(([date, counts]) => {
                const entries = foodItems
                  .filter(f => (counts[f.id] || 0) > 0)
                  .map(f => ({ ...f, count: counts[f.id] }));
                const dayTotal = entries.reduce((s, f) => s + f.calories * f.count, 0);

                return (
                  <div className="history-card" key={date}>
                    <div className="history-card-header">
                      <span className="history-date">{formatDate(date)}</span>
                      <span className="history-kcal">{dayTotal.toLocaleString()} kcal</span>
                    </div>
                    {entries.length === 0 ? (
                      <p className="history-empty">No items recorded</p>
                    ) : (
                      <div className="history-items">
                        {entries.map(f => (
                          <div className="history-item" key={f.id}>
                            <span className="history-item-name">{f.name}</span>
                            <span className="history-item-right">
                              x{f.count} · {(f.calories * f.count).toLocaleString()} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
