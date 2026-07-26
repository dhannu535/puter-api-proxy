import React, { useState, useEffect, useCallback } from "react";
import Overview from "./pages/Overview.jsx";
import Models from "./pages/Models.jsx";
import Playground from "./pages/Playground.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";
import "./styles.css";

const TABS = [
  { id: "overview", label: "Overview", icon: "⚡" },
  { id: "models", label: "Models", icon: "🧠" },
  { id: "playground", label: "Playground", icon: "🧪" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function App() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({ stats: null, models: null, config: null, timeline: null, requests: null, health: null });

  const fetchData = useCallback(async () => {
    try {
      const [stats, models, config, timeline, requests, health] = await Promise.all([
        fetch("/puter-api-proxy/api/stats").then((r) => r.json()),
        fetch("/puter-api-proxy/api/models").then((r) => r.json()),
        fetch("/puter-api-proxy/api/config").then((r) => r.json()),
        fetch("/puter-api-proxy/api/timeline").then((r) => r.json()),
        fetch("/puter-api-proxy/api/requests").then((r) => r.json()),
        fetch("/puter-api-proxy/api/health").then((r) => r.json()),
      ]);
      setData({ stats, models, config, timeline, requests, health });
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <div>
              <div className="logo-title">Puter Proxy</div>
              <div className="logo-sub">v2.0 · 146 models</div>
            </div>
          </div>
        </div>
        <div className="nav-items">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`nav-btn ${tab === t.id ? "active" : ""}`}>
              <span className="nav-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>Docker running</span>
        </div>
      </nav>
      <main className="main">
        {tab === "overview" && <Overview data={data} refresh={fetchData} />}
        {tab === "models" && <Models data={data} />}
        {tab === "playground" && <Playground config={data.config} />}
        {tab === "analytics" && <Analytics data={data} />}
        {tab === "settings" && <Settings data={data} refresh={fetchData} />}
      </main>
    </div>
  );
}
