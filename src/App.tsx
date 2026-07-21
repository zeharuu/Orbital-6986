import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/AppContext";
import { MapProvider } from "./context/MapContext";
import { ChallengesProvider } from "./context/ChallengesContext";
import BottomNav from "./components/BottomNav";
import EmailGate from "./routes/EmailGate";
import Home from "./routes/Home";
import Search from "./routes/Search";
import Log from "./routes/Log";
import Profile from "./routes/Profile";
import MapPage from "./routes/Map";
import Challenges from "./routes/Challenges";
import "./App.css";

function Shell() {
  const { emailConfirmed, browsingAsGuest, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="email-gate">
        <img src="/favicon.svg" alt="NutriNUS" className="gate-logo" />
        <div className="gate-title">Nutri<span className="brand-nus">NUS</span></div>
        <div className="gate-sub">Your NUS food companion</div>
      </div>
    );
  }

  if (!emailConfirmed && !browsingAsGuest) {
    return <EmailGate />;
  }

  return (
    <>
      <div className="screen">
        <Routes>
          <Route path="/"        element={<Navigate to={browsingAsGuest ? "/search" : "/home"} replace />} />
          <Route path="/home"    element={<Home />} />
          <Route path="/search"  element={<Search />} />
          <Route path="/log"     element={<Log />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/map"     element={<MapPage />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="*"        element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ChallengesProvider>
          <MapProvider>
            <div className="app">
              <Shell />
            </div>
          </MapProvider>
        </ChallengesProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
