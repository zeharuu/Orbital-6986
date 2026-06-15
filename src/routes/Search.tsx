import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const filters  = ["All", "High Protein", "Low Cal", "Vegetarian"];

export default function Search() {
  const navigate = useNavigate();
  const {
    emailConfirmed,
    profileComplete, profileCreated, loggedCounts, addFood, removeFood,
    isOverLimit, remaining, setProfilePrompt, foodItems, foodLoading, stopGuestBrowsing,
  } = useApp();

  const canteens = useMemo(() => ["All", ...Array.from(new Set(foodItems.map(f => f.canteen)))], [foodItems]);

  const [searchQuery, setSearchQuery]   = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeCanteen, setActiveCanteen] = useState("All");

  const filteredFood = foodItems.filter(f => {
    const matchSearch  = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter  = activeFilter === "All" || f.tags.includes(activeFilter);
    const matchCanteen = activeCanteen === "All" || f.canteen === activeCanteen;
    return matchSearch && matchFilter && matchCanteen;
  });

  return (
    <div className="page search-page">
      <div className="search-top">
        <div className="search-canteen-label">Canteens</div>
        <div className="search-canteen-name">
          {activeCanteen === "All" ? "All Canteens" : activeCanteen}
          {activeCanteen !== "All" && <span className="current-chip">Current Search</span>}
        </div>
      </div>

      <div className="canteen-chips">
        {canteens.map(c => (
          <button
            key={c}
            className={`canteen-chip${activeCanteen === c ? " active" : ""}`}
            onClick={() => setActiveCanteen(c)}
          >{c}</button>
        ))}
      </div>

      <div className="search-box-wrap">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" className="search-icon-svg">
          <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          className="search-input"
          placeholder="Search food..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="filter-chips">
        {filters.map(f => (
          <button
            key={f}
            className={`filter-chip${activeFilter === f ? " active" : ""}`}
            onClick={() => setActiveFilter(f)}
          >{f}</button>
        ))}
      </div>

      {!profileComplete && (
        <div className="search-no-profile-notice">
          <span>📋 </span>
          <span>
            <strong>Browsing is open</strong> —{" "}
            <button
              className="inline-link"
              onClick={() => {
                if (!emailConfirmed) {
                  stopGuestBrowsing();
                  return;
                }
                navigate("/profile");
              }}
            >
              {!emailConfirmed ? "sign in" : !profileCreated ? "set up your profile" : "add height & weight"}
            </button>{" "}
            when you want to log food
          </span>
        </div>
      )}

      {isOverLimit && profileComplete && (
        <div className="over-limit-banner">
          ⚠️ You've exceeded your daily target by <strong>{Math.abs(remaining!)} kcal</strong>
        </div>
      )}

      {foodLoading ? (
        <div className="empty-card">Loading food items...</div>
      ) : foodItems.length === 0 ? (
        <div className="empty-card">No food items available yet</div>
      ) : (
        <>
          <div className="results-count">
            {filteredFood.length} results: {activeCanteen === "All" ? "All Canteens" : activeCanteen}
          </div>

          <div className="search-results">
            {filteredFood.map(food => {
              const count = loggedCounts[food.id] || 0;
              return (
                <div className="result-card" key={food.id}>
                  <div className="result-thumb" />
                  <div className="result-body">
                    <div className="result-top">
                      <div>
                        <div className="result-name">{food.name}</div>
                        <div className="result-stall">{food.stall}</div>
                      </div>
                      <div className="result-cal-block">
                        <div className="result-cal">{food.calories}</div>
                        <div className="result-cal-unit">kcal</div>
                      </div>
                    </div>

                    <div className="result-macros">
                      {[
                        { val: `${food.protein}g`, lbl: "PROTEIN" },
                        { val: `${food.carbs}g`,   lbl: "CARBS" },
                        { val: `${food.fat}g`,     lbl: "FAT" },
                        { val: `${food.sodium}g`,  lbl: "SODIUM" },
                      ].map(({ val, lbl }) => (
                        <div className="rmacro" key={lbl}>
                          <span className="rmacro-val">{val}</span>
                          <span className="rmacro-lbl">{lbl}</span>
                        </div>
                      ))}
                    </div>

                    {food.tags.length > 0 && (
                      <div className="result-tags">
                        {food.tags.map(t => <span key={t} className="result-tag">{t}</span>)}
                        {profileComplete && remaining !== null && food.calories <= remaining && (
                          <span className="result-tag match">✓ Fits your target</span>
                        )}
                      </div>
                    )}

                    {!profileComplete ? (
                      <button
                        className="result-log-btn locked"
                        onClick={() => {
                          if (!emailConfirmed) {
                            stopGuestBrowsing();
                            return;
                          }
                          setProfilePrompt(true);
                          navigate("/profile");
                        }}
                      >
                        🔒 {!emailConfirmed ? "Sign in to log" : !profileCreated ? "Set up profile to log" : "Add height & weight to log"}
                      </button>
                    ) : count === 0 ? (
                      <button
                        className="result-log-btn"
                        onClick={() => { addFood(food.id); navigate("/log"); }}
                      >
                        + Add to Log
                      </button>
                    ) : (
                      <div className="qty-row">
                        <button className="qty-btn" onClick={() => removeFood(food.id)}>−</button>
                        <span className="qty-count">{count} added</span>
                        <button className="qty-btn add" onClick={() => addFood(food.id)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
