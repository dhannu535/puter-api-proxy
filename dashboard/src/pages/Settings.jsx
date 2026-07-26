import React, { useState } from "react";

export default function Settings({ data, refresh }) {
  const { config } = data;
  const [strategy, setStrategy] = useState(config?.strategy || "free_first");
  const [saved, setSaved] = useState(false);

  const saveStrategy = async () => {
    await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ strategy }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  };

  const clearCooldowns = async () => {
    await fetch("/api/cooldowns/clear", { method: "POST" });
    refresh();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure routing strategy, view connection details, and manage model health.</p>
      </div>

      {/* Routing Strategy */}
      <div className="section">
        <div className="section-title">Routing Strategy</div>
        <div className="strategy-grid">
          {strategies.map((s) => (
            <div key={s.id} className={`strategy-card ${strategy === s.id ? "active" : ""}`} onClick={() => setStrategy(s.id)}>
              <div className="name">{s.icon} {s.id}</div>
              <div className="desc">{s.desc}</div>
            </div>
          ))}
        </div>
        <button onClick={saveStrategy} className="btn btn-primary">{saved ? "✓ Saved!" : "Save Strategy"}</button>
      </div>

      {/* Connection Info */}
      <div className="section">
        <div className="section-title">API Configuration</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Setting</th><th>Value</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td>Base URL</td><td className="mono">http://localhost:{config?.port || 3800}/v1</td><td style={{color:"var(--text-dim)"}}>OpenAI-compatible endpoint</td></tr>
              <tr><td>API Key</td><td className="mono">sk-puter-proxy</td><td style={{color:"var(--text-dim)"}}>Set API_KEY env var to change</td></tr>
              <tr><td>Model</td><td className="mono">auto</td><td style={{color:"var(--text-dim)"}}>Or any specific model ID</td></tr>
              <tr><td>Fallback Chain</td><td className="mono">{config?.fallbackChainLength || 146} models</td><td style={{color:"var(--text-dim)"}}>Free → Cheap → Mid → Premium</td></tr>
              <tr><td>Max Retries</td><td className="mono">20 models/request</td><td style={{color:"var(--text-dim)"}}>Tries 20 models before failing</td></tr>
              <tr><td>Retry Budget</td><td className="mono">30 seconds</td><td style={{color:"var(--text-dim)"}}>Wall-clock timeout per request</td></tr>
              <tr><td>Cooldown</td><td className="mono">60s after 3 failures</td><td style={{color:"var(--text-dim)"}}>Failed models get auto-skipped</td></tr>
              <tr><td>Sticky Sessions</td><td className="mono">30 min TTL</td><td style={{color:"var(--text-dim)"}}>Multi-turn stays on same model</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Health Management */}
      <div className="section">
        <div className="section-title">Model Health</div>
        <div className="instructions">
          <p style={{ marginBottom: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Models that fail 3+ times get a 60-second cooldown (auto-skipped). This prevents wasting time on broken models.
          </p>
          <button onClick={clearCooldowns} className="btn btn-danger">Clear All Cooldowns</button>
        </div>
      </div>

      {/* Docker */}
      <div className="section">
        <div className="section-title">Docker Commands</div>
        <div className="code-block">
          <div className="code-header"><span>Shell</span><span>docker-compose</span></div>
          <pre>{`# Start the proxy
docker compose up -d

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build

# Stop
docker compose down`}</pre>
        </div>
      </div>

      {/* Client Setup */}
      <div className="section">
        <div className="section-title">Client Setup</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Configuration</th></tr></thead>
            <tbody>
              <tr><td>OpenAI Python SDK</td><td className="mono">OpenAI(base_url="http://localhost:{config?.port || 3800}/v1", api_key="sk-puter-proxy")</td></tr>
              <tr><td>OpenAI Node SDK</td><td className="mono">new OpenAI({'{'} baseURL: "http://localhost:{config?.port || 3800}/v1", apiKey: "sk-puter-proxy" {'}'})</td></tr>
              <tr><td>LangChain</td><td className="mono">ChatOpenAI(base_url="http://localhost:{config?.port || 3800}/v1", api_key="sk-puter-proxy", model="auto")</td></tr>
              <tr><td>Continue (VS Code)</td><td className="mono">apiBase: http://localhost:{config?.port || 3800}/v1</td></tr>
              <tr><td>Cursor</td><td className="mono">OpenAI API Base → http://localhost:{config?.port || 3800}/v1</td></tr>
              <tr><td>Cline / Roo Code</td><td className="mono">Provider: OpenAI Compatible, Base URL: http://localhost:{config?.port || 3800}/v1</td></tr>
              <tr><td>Aider</td><td className="mono">OPENAI_API_BASE=http://localhost:{config?.port || 3800}/v1 OPENAI_API_KEY=sk-puter-proxy aider</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const strategies = [
  { id: "free_first", icon: "💚", desc: "Free models first → cheap → mid → premium. Best for saving Puter allowance." },
  { id: "balanced", icon: "⚖️", desc: "Spreads requests evenly across free and cheap tiers." },
  { id: "quality", icon: "⭐", desc: "Premium models first → mid → cheap → free. Best quality, uses most allowance." },
  { id: "smart", icon: "🧠", desc: "Auto-detects complexity. Simple→free, complex→premium." },
];
