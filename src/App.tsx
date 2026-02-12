import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setStatus(data.ok ? "OK" : "FAIL"))
      .catch(() => setStatus("FAIL"));
  }, []);

  return (
    <>
      <h1>SteamQuack</h1>
      <p>Backend: {status}</p>
    </>
  );
}

export default App;
