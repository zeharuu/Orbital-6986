import { useState } from "react";
import "./App.css";

type Page = "home" | "profile" | "food";

type FoodItem = {
  id: number;
  name: string;
  canteen: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

const foodItems: FoodItem[] = [
  { id: 1, name: "Chicken Rice", canteen: "The Deck", calories: 600, protein: 28, carbs: 65, fats: 22 },
  { id: 2, name: "Yong Tau Foo", canteen: "Frontier", calories: 420, protein: 25, carbs: 45, fats: 12 },
  { id: 3, name: "Ban Mian", canteen: "TechnoEdge", calories: 550, protein: 22, carbs: 70, fats: 16 },
  { id: 4, name: "Salmon Soba Bowl", canteen: "The Deck", calories: 480, protein: 30, carbs: 50, fats: 14 },
];

export default function App() {
  const [page, setPage] = useState<Page>("home");

  const [name, setName] = useState("");
  const [gender, setGender] = useState("Female");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("Maintain weight");
  const [profileCreated, setProfileCreated] = useState(false);

  const [addedFoodIds, setAddedFoodIds] = useState<number[]>([]);

  const heightInM = Number(height) / 100;
  const bmi =
    height && weight
      ? (Number(weight) / (heightInM * heightInM)).toFixed(1)
      : "-";

  const calculateBMR = () => {
    const weightNum = Number(weight);
    const heightNum = Number(height);
    const ageNum = Number(age);

    if (!weightNum || !heightNum || !ageNum) {
      return 0;
    }

    if (gender === "Male") {
      return 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      return 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }
  };

  const bmr = calculateBMR();

  const maintenanceCalories = bmr * 1.4;

  const calorieTarget =
    bmr === 0
      ? "-"
      : goal === "Lose weight"
      ? Math.round(maintenanceCalories - 300)
      : goal === "Gain muscle"
      ? Math.round(maintenanceCalories + 300)
      : Math.round(maintenanceCalories);

  const addToLog = (foodId: number) => {
    if (addedFoodIds.includes(foodId)) {
      setAddedFoodIds(addedFoodIds.filter((id) => id !== foodId));
    } else {
      setAddedFoodIds([...addedFoodIds, foodId]);
    }
  };

  return (
    <div className="app">
      <h1>Nutri<span>NUS</span></h1>
      <p className="tagline">Your NUS food companion for better choices.</p>

      <div className="nav">
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("profile")}>Create Profile</button>
        <button onClick={() => setPage("food")}>Food Options</button>
      </div>

      {page === "home" && (
        <section className="card">
          <h2>Join Our Vision</h2>

          <div className="vision-grid">
            <div className="vision-box">
              <h3>Discover</h3>
              <p>
                Access clearer nutrition information across NUS canteens.
              </p>
            </div>

            <div className="vision-box">
              <h3>Track</h3>
              <p>
                Create a profile and monitor your basic nutritional targets.
              </p>
            </div>

            <div className="vision-box">
              <h3>Choose Smarter</h3>
              <p>
                Compare campus food options and make more informed choices.
              </p>
            </div>
          </div>
        </section>
      )}

      {page === "profile" && (
        <section className="card">
          <h2>Create Your Profile</h2>

          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          <input
            placeholder="Height (cm)"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
       <input
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option>Female</option>
            <option>Male</option>
            <option>Prefer not to say</option>
          </select>

          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option>Lose weight</option>
            <option>Maintain weight</option>
            <option>Gain muscle</option>
          </select>

          <button onClick={() => setProfileCreated(true)}>Save Profile</button>

          {profileCreated && (
            <div className="summary">
              <h3>Your Profile Summary</h3>
              <p><strong>Name:</strong> {name || "-"}</p>
              <p><strong>Gender:</strong> {gender}</p>
              <p><strong>Age:</strong> {age || "-"}</p>
              <p><strong>BMI:</strong> {bmi}</p>
              <p><strong>BMR:</strong> {bmr ? Math.round(bmr) : "-"} kcal</p>
              <p><strong>Goal:</strong> {goal}</p>
              <p><strong>Daily Calorie Target:</strong> {calorieTarget} kcal</p>
            </div>
          )}
        </section>
      )}

      {page === "food" && (
        <section className="card">
          <h2>Food Options</h2>

          <div className="food-grid">
            {foodItems.map((food) => (
              <div className="food-card" key={food.id}>
                <h3>{food.name}</h3>
                <p>{food.canteen}</p>
                <p>{food.calories} kcal</p>
                <p>P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g</p>

                <button
                  className={addedFoodIds.includes(food.id) ? "added-button" : ""}
                  onClick={() => addToLog(food.id)}
                >
                  {addedFoodIds.includes(food.id) ? "Added to Log" : "Add to Log"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
} 