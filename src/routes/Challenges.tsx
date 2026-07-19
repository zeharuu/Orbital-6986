import { useApp } from "../context/AppContext";
import { useChallenges } from "../context/ChallengesContext";
import {
  biteTierName, inferCuisine, POINTS_DAILY_STREAK, POINTS_THREE_STALLS, POINTS_TWO_CANTEENS,
  POINTS_FIVE_DAY_STREAK, POINTS_TEN_DAY_CALORIE_STREAK, POINTS_HEALTHY_PICK,
  POINTS_GOAL_HIT_BY_DEADLINE, POINTS_BITE_TIER, POINTS_CUISINE_PICK,
  VOUCHER_DRINK_COST, VOUCHER_FOOD_COST,
} from "../data";

export default function Challenges() {
  const {
    emailConfirmed, profileCreated, stopGuestBrowsing, streakDays, loggedCounts, addFood,
    useTargetMode, targetBmi, targetDate, isOverLimit, remaining, logHistory,
  } = useApp();
  const {
    loading, todayKey, points, lifetimePoints, goalAchievedForTarget,
    threeStallsClaimedDate, twoCanteensClaimedDate, calorieStreak,
    lifetimeActiveDays, claimedBiteDaysAt,
    todaysHealthyPicks, todaysCuisinePicks, pendingClaims, claim,
    vouchers, redeemDrink, redeemFood, markVoucherUsed,
  } = useChallenges();

  if (!emailConfirmed) {
    return (
      <div className="page challenges-page">
        <h2 className="page-title">Challenges</h2>
        <div className="empty-card">
          <p>Sign in to start earning points and rewards.</p>
          <button className="orange-btn" onClick={stopGuestBrowsing}>Sign in</button>
        </div>
      </div>
    );
  }

  if (!profileCreated) {
    return (
      <div className="page challenges-page">
        <h2 className="page-title">Challenges</h2>
        <div className="empty-card">
          <p>Set up your profile to start earning points and rewards.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page challenges-page">
        <h2 className="page-title">Challenges</h2>
        <div className="empty-card"><p>Loading your points...</p></div>
      </div>
    );
  }

  const isPending = (id: string) => pendingClaims.some(c => c.id === id);
  const nextStreakMilestone = Math.ceil((streakDays + 1) / 5) * 5;
  const nextCalorieMilestone = Math.ceil((calorieStreak + 1) / 10) * 10;

  // Most recent day (before today) with anything logged - lets us say when a broken
  // logging streak was actually lost, derived purely from logHistory (no AppContext change needed).
  const lastActiveDateBeforeToday = Object.entries(logHistory)
    .filter(([date, dayMap]) => date !== todayKey && Object.values(dayMap).some(c => c > 0))
    .map(([date]) => date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
  const formattedLastActiveDate = lastActiveDateBeforeToday
    ? new Date(lastActiveDateBeforeToday).toLocaleDateString("en-SG", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;
  const targetSignature = useTargetMode && targetBmi && targetDate ? `${targetBmi}|${targetDate}` : "";

  const BADGES = [
    {
      key: "threeStalls", label: "Stall Explorer", desc: "Log food from 3 different stalls today",
      points: POINTS_THREE_STALLS, earnedToday: threeStallsClaimedDate === todayKey,
    },
    {
      key: "twoCanteens", label: "Canteen Hopper", desc: "Log food from 2 different canteens today",
      points: POINTS_TWO_CANTEENS, earnedToday: twoCanteensClaimedDate === todayKey,
    },
    {
      key: "goalHitByDeadline", label: "Goal Crusher", desc: "Hit your target BMI by your deadline",
      points: POINTS_GOAL_HIT_BY_DEADLINE, earnedToday: !!targetSignature && goalAchievedForTarget === targetSignature,
    },
  ];

  return (
    <div className="page challenges-page">
      <h2 className="page-title">Challenges</h2>

      <div className="points-hero">
        <div className="points-hero-top">
          <span className="points-hero-icon">🍡</span>
          <span className="points-hero-value">{points.toLocaleString()}</span>
        </div>
        <span className="points-hero-label">points available</span>
        <span className="points-hero-lifetime">{lifetimePoints.toLocaleString()} earned lifetime</span>
      </div>

      {pendingClaims.length === 0 && (
        <div className="all-claimed-banner">🎉 Come back tomorrow for more achievements!</div>
      )}

      <h3 className="challenges-section-title">Achievements</h3>
      <div className="badge-grid">
        {BADGES.map(badge => {
          const claimable = isPending(badge.key);
          return (
            <div className={`badge-card${badge.earnedToday ? " earned" : ""}${claimable ? " claimable" : ""}`} key={badge.key}>
              <div className="badge-icon">{badge.earnedToday ? "🏆" : claimable ? "🎁" : "🔒"}</div>
              <div className="badge-label">{badge.label}</div>
              <div className="badge-desc">{badge.desc}</div>
              {claimable ? (
                <button className="claim-btn" onClick={() => claim(badge.key)}>Claim +{badge.points} pts</button>
              ) : (
                <div className="badge-points">+{badge.points} pts{badge.earnedToday && <span className="badge-claimed-tag"> · Claimed</span>}</div>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="challenges-section-title">Streaks</h3>
      <div className="challenge-streak-card">
        <div className="challenge-streak-card-header">
          <span>🍽️ {biteTierName(claimedBiteDaysAt + 10)}</span>
          <span>{lifetimeActiveDays} days</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${Math.min(100, ((lifetimeActiveDays - claimedBiteDaysAt) / 10) * 100)}%` }} />
        </div>
        {isPending("biteTier") ? (
          <button className="claim-btn full" onClick={() => claim("biteTier")}>Claim +{POINTS_BITE_TIER} pts</button>
        ) : (
          <div className="challenge-streak-card-foot">+{POINTS_BITE_TIER} pts every 10 active days · next at {claimedBiteDaysAt + 10} days</div>
        )}
      </div>
      <div className="challenge-streak-card">
        <div className="challenge-streak-card-header">
          <span>🔥 Logging Streak</span>
          <span>{streakDays} days</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${(streakDays % 5) / 5 * 100}%` }} />
        </div>
        {isPending("dailyStreak") && (
          <button className="claim-btn full" onClick={() => claim("dailyStreak")}>Claim +{POINTS_DAILY_STREAK} pts (today)</button>
        )}
        {isPending("streak") ? (
          <button className="claim-btn full" onClick={() => claim("streak")}>Claim +{POINTS_FIVE_DAY_STREAK} pts</button>
        ) : streakDays === 0 && formattedLastActiveDate ? (
          <div className="challenge-streak-card-foot warn">
            ⚠️ Streak lost, you last logged on {formattedLastActiveDate}. Log today to start a new one!
          </div>
        ) : (
          <div className="challenge-streak-card-foot">+{POINTS_DAILY_STREAK} pts every active day, +{POINTS_FIVE_DAY_STREAK} pts every 5 days · next milestone at {nextStreakMilestone} days</div>
        )}
      </div>
      <div className="challenge-streak-card">
        <div className="challenge-streak-card-header">
          <span>🎯 Calorie Target Streak</span>
          <span>{calorieStreak} days</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${(calorieStreak % 10) / 10 * 100}%` }} />
        </div>
        {isPending("calorieStreak") ? (
          <button className="claim-btn full" onClick={() => claim("calorieStreak")}>Claim +{POINTS_TEN_DAY_CALORIE_STREAK} pts</button>
        ) : isOverLimit && calorieStreak === 0 ? (
          <div className="challenge-streak-card-foot warn">
            ⚠️ Streak reset, you exceeded your calorie target today by {Math.abs(remaining!)} kcal.
          </div>
        ) : (
          <div className="challenge-streak-card-foot">+{POINTS_TEN_DAY_CALORIE_STREAK} pts every 10 days · next at {nextCalorieMilestone} days</div>
        )}
      </div>

      <h3 className="challenges-section-title">Today's Healthy Picks</h3>
      {todaysHealthyPicks.length === 0 ? (
        <div className="empty-card"><p>No healthy picks available today.</p></div>
      ) : (
        <div className="healthy-picks-list">
          {todaysHealthyPicks.map(item => (
            <div className="healthy-pick-row" key={item.id}>
              <div className="meal-info">
                <div className="meal-name">{item.name}</div>
                <div className="meal-canteen">{item.stall} · {item.canteen}</div>
              </div>
              <div className="healthy-pick-actions">
                <button className="pick-add-btn" onClick={() => addFood(item.id)} title="Add to today's log">
                  + {(loggedCounts[item.id] || 0) > 0 ? loggedCounts[item.id] : ""}
                </button>
                {isPending("healthyPick") ? (
                  <button className="claim-btn" onClick={() => claim("healthyPick")}>Claim +{POINTS_HEALTHY_PICK} pts</button>
                ) : (
                  <span className="healthy-pick-points">+{POINTS_HEALTHY_PICK} pts</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="challenges-section-title">Try Something New</h3>
      {todaysCuisinePicks.length === 0 ? (
        <div className="empty-card"><p>No picks available today.</p></div>
      ) : (
        <div className="healthy-picks-list">
          {todaysCuisinePicks.map(item => (
            <div className="healthy-pick-row cuisine" key={item.id}>
              <div className="meal-info">
                <div className="meal-name">{item.name} <span className="cuisine-tag">{inferCuisine(item.name, item.stall)}</span></div>
                <div className="meal-canteen">{item.stall} · {item.canteen}</div>
              </div>
              <div className="healthy-pick-actions">
                <button className="pick-add-btn cuisine" onClick={() => addFood(item.id)} title="Add to today's log">
                  + {(loggedCounts[item.id] || 0) > 0 ? loggedCounts[item.id] : ""}
                </button>
                {isPending("cuisinePick") ? (
                  <button className="claim-btn cuisine" onClick={() => claim("cuisinePick")}>Claim +{POINTS_CUISINE_PICK} pts</button>
                ) : (
                  <span className="healthy-pick-points cuisine">+{POINTS_CUISINE_PICK} pts</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="challenges-section-title">Redeem Rewards</h3>
      <div className="redeem-grid">
        <div className="redeem-card">
          <div className="redeem-icon">🥤</div>
          <div className="redeem-label">Free Drink</div>
          <div className="redeem-cost">{VOUCHER_DRINK_COST} pts</div>
          <button className="orange-btn" onClick={redeemDrink} disabled={points < VOUCHER_DRINK_COST}>
            Redeem
          </button>
        </div>
        <div className="redeem-card">
          <div className="redeem-icon">🍱</div>
          <div className="redeem-label">$5 Food Item</div>
          <div className="redeem-cost">{VOUCHER_FOOD_COST} pts</div>
          <button className="orange-btn" onClick={redeemFood} disabled={points < VOUCHER_FOOD_COST}>
            Redeem
          </button>
        </div>
      </div>

      {vouchers.length > 0 && (
        <>
          <h3 className="challenges-section-title">My Vouchers</h3>
          <div className="voucher-list">
            {vouchers.slice().reverse().map(voucher => (
              <div className={`voucher-card${voucher.used ? " used" : ""}`} key={voucher.id}>
                <div className="voucher-info">
                  <div className="voucher-type">{voucher.type === "drink" ? "🥤 Free Drink" : "🍱 $5 Food Item"}</div>
                  <div className="voucher-meta">
                    {voucher.used ? "Used" : "Show this at any participating stall"}
                  </div>
                </div>
                {!voucher.used && (
                  <button className="voucher-use-btn" onClick={() => markVoucherUsed(voucher.id)}>
                    Mark as Used
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
