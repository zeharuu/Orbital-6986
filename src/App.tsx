import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/AppContext";
import BottomNav from "./components/BottomNav";
import EmailGate from "./routes/EmailGate";
import Home from "./routes/Home";
import Search from "./routes/Search";
import Log from "./routes/Log";
import Profile from "./routes/Profile";
import "./App.css";

function Shell() {
  const { emailConfirmed } = useApp();

  if (!emailConfirmed) {
    return <EmailGate />;
  }

  return (
    <>
      <div className="screen">
        <Routes>
          <Route path="/"        element={<Navigate to="/home" replace />} />
          <Route path="/home"    element={<Home />} />
          <Route path="/search"  element={<Search />} />
          <Route path="/log"     element={<Log />} />
          <Route path="/profile" element={<Profile />} />
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
        <div className="app">
          <Shell />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
