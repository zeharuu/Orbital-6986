import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const filters  = ["All", "High Protein", "Low Cal", "Vegetarian"];
const sizeOrder = ["Half", "Small", "Normal", "Medium", "Full", "Large", "Upsize"];

const canteenAliases: Record<string, string[]> = {
  "YIH": ["yih", "yusof", "yusof ishak", "yusof ishak house"],
  "UTown": ["utown", "university town", "u town"],
  "TechnoEdge": ["technoedge", "techno edge", "techno"],
};

// "Alfredo (Small)" -> { baseName: "Alfredo", size: "Small" }
// "Sunrise Sandwich (Half)" -> { baseName: "Sunrise Sandwich", size: "Half" }
// "Chicken Briyani"  -> { baseName: "Chicken Briyani", size: null }
function parseSizeVariant(name: string) {
  const match = name.match(/^(.+?)\s*\((Half|Full|Small|Normal|Medium|Large|Upsize)\)$/i);
  if (!match) return { baseName: name, size: null as string | null };
  return { baseName: match[1], size: match[2] };
}

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
  const [selectedSize, setSelectedSize]   = useState<Record<string, string>>({});

  // Group same dish across sizes (e.g. Alfredo Small/Normal/Upsize) into one card.
  const groups = useMemo(() => {
    const map = new Map<string, { key: string; baseName: string; canteen: string; stall: string; variants: { size: string | null; item: typeof foodItems[number] }[] }>();
    for (const item of foodItems) {
      const { baseName, size } = parseSizeVariant(item.name);
      const key = `${item.canteen}|${item.stall}|${baseName}`;
      if (!map.has(key)) map.set(key, { key, baseName, canteen: item.canteen, stall: item.stall, variants: [] });
      map.get(key)!.variants.push({ size, item });
    }
    for (const group of map.values()) {
      group.variants.sort((a, b) => sizeOrder.indexOf(a.size ?? "") - sizeOrder.indexOf(b.size ?? ""));
    }
    return Array.from(map.values());
  }, [foodItems]);

  const filteredGroups = groups.filter(g => {
    const query = searchQuery.toLowerCase();
    const aliases = canteenAliases[g.canteen] || [];
    const matchSearch =
      g.baseName.toLowerCase().includes(query) ||
      g.stall.toLowerCase().includes(query) ||
      g.canteen.toLowerCase().includes(query) ||
      aliases.some(alias => alias.includes(query) || query.includes(alias));
    const matchFilter  = activeFilter === "All" || g.variants.some(v => v.item.tags.includes(activeFilter));
    const matchCanteen = activeCanteen === "All" || g.canteen === activeCanteen;
    return matchSearch && matchFilter && matchCanteen;
  });

  return (
    <div className="page search-page">
      <div className="utown-disclaimer">
        * Nutritional information is based on estimates and may not be exact.
      </div>

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
            {filteredGroups.length} results: {activeCanteen === "All" ? "All Canteens" : activeCanteen}
          </div>

          <div className="search-results">
            {filteredGroups.map(group => {
              const hasSizes = group.variants.length > 1;
              const chosenSize = selectedSize[group.key];
              const activeVariant = group.variants.find(v => v.size === chosenSize) || group.variants[0];
              const food = activeVariant.item;
              const count = loggedCounts[food.id] || 0;
              return (
                <div className="result-card" key={group.key}>
                  <div className="result-body">
                    <div className="result-top">
                      <div>
                        <div className="result-name">{group.baseName}</div>
                        <div className="result-stall">{food.stall}</div>
                      </div>
                      <div className="result-cal-block">
                        <div className="result-cal">{food.calories}</div>
                        <div className="result-cal-unit">kcal</div>
                      </div>
                    </div>

                    {hasSizes && (
                      <div className="size-chips">
                        {group.variants.map(v => (
                          <button
                            key={v.size}
                            className={`size-chip${activeVariant.size === v.size ? " active" : ""}`}
                            onClick={() => setSelectedSize(prev => ({ ...prev, [group.key]: v.size! }))}
                          >{v.size}</button>
                        ))}
                      </div>
                    )}

                    <div className="result-macros">
                      {[
                        { num: food.protein, val: `${food.protein}g`, lbl: "PROTEIN" },
                        { num: food.carbs,   val: `${food.carbs}g`,   lbl: "CARBS" },
                        { num: food.fat,     val: `${food.fat}g`,     lbl: "FAT" },
                        ...(food.sodium !== undefined ? [{ num: food.sodium, val: `${food.sodium}g`, lbl: "SODIUM" }] : []),
                      ].filter(m => m.num > 0).map(({ val, lbl }) => (
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
