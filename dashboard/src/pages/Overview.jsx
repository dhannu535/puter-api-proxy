import React from "react";

export default function Overview({ data, refresh }) {
  const { stats, config, timeline } = data;
  if (!stats) return <div className="empty-state">Loading dashboard...</div>;

  const maxReqs = Math.max(...(timeline || []).map((t) => t.requests), 1);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Smart routing proxy with zero-failure fallback across 146 free & paid AI models</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Requests</div>
          <div className="value">{stats.total.requests.toLocaleString()}</div>
          <div className="sub">{stats.last1h.requests} in last hour</div>
        </div>
        <div className="stat-card">
          <div className="label">Success Rate</div>
          <div className="value" style={{ color: "var(--green)" }}>{stats.total.successRate}%</div>
          <div className="sub">{stats.total.failures} total failures</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg Latency</div>
          <div className="value" style={{ color: "var(--accent)" }}>{stats.last1h.avgLatency}ms</div>
          <div className="sub">P95: {stats.last1h.p95Latency}ms</div>
        </div>
        <div className="stat-card">
          <div className="label">Uptime</div>
          <div className="value" style={{ color: "var(--purple)" }}>{formatUptime(stats.uptime)}</div>
          <div className="sub">Strategy: {config?.strategy || "free_first"}</div>
        </div>
        <div className="stat-card">
          <div className="label">Models in Chain</div>
          <div className="value" style={{ color: "var(--cyan)" }}>{config?.fallbackChainLength || 146}</div>
          <div className="sub">4 tiers: free → cheap → mid → premium</div>
        </div>
        <div className="stat-card">
          <div className="label">Failures (1h)</div>
          <div className="value" style={{ color: stats.last1h.failures > 0 ? "var(--red)" : "var(--green)" }}>{stats.last1h.failures}</div>
          <div className="sub">{stats.last1h.failures === 0 ? "All calls succeeded" : "Auto-fallback handled"}</div>
        </div>
      </div>

      {/* Timeline Chart */}
      {timeline && timeline.length > 0 && (
        <div className="section">
          <div className="section-title">Request Volume (24h) <span className="badge">Live</span></div>
          <div className="chart-container">
            <div className="bar-chart">
              {timeline.map((b, i) => {
                const height = (b.requests / maxReqs) * 100;
                const hasErrors = b.failures > 0;
                return (
                  <div className="bar-col" key={i}>
                    <div className={`bar-fill ${hasErrors ? "has-errors" : "success"}`} style={{ height: `${Math.max(height, 2)}%` }}>
                      <div className="bar-tooltip">{b.requests} reqs{hasErrors ? `, ${b.failures} fail` : ""}</div>
                    </div>
                    <div className="bar-label">{b.hour}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Instructions */}
      <div className="section">
        <div className="section-title">Quick Start</div>
        <div className="instructions">
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-content">
              <div className="step-title">Point any OpenAI-compatible client at this proxy</div>
              <div className="step-desc">Base URL: http://localhost:{config?.port || 3800}/v1 — API Key: sk-puter-proxy</div>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-content">
              <div className="step-title">Use model "auto" for smart free-first routing</div>
              <div className="step-desc">Or specify any model (claude-opus-5, gpt-5.6-sol, etc.) — it falls back if that model fails</div>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-content">
              <div className="step-title">Your calls never fail</div>
              <div className="step-desc">Each request tries up to 20 models across 4 tiers. Free models tried first to save your Puter allowance.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="section">
        <div className="section-title">Usage Examples</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="code-block">
            <div className="code-header"><span>Python</span><span>OpenAI SDK</span></div>
            <pre>{`from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:${config?.port || 3800}/v1",
    api_key="sk-puter-proxy",
)

resp = client.chat.completions.create(
    model="auto",  # free-first routing
    messages=[{"role": "user", "content": "Hello!"}],
)
print(resp.choices[0].message.content)
print(f"Model used: {resp.model}")`}</pre>
          </div>
          <div className="code-block">
            <div className="code-header"><span>curl</span><span>HTTP</span></div>
            <pre>{`curl http://localhost:${config?.port || 3800}/v1/chat/completions \\
  -H "Authorization: Bearer sk-puter-proxy" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'

# Response includes _routing metadata:
# "routed_to", "latency_ms", "attempts"`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatUptime(s) {
  if (!s) return "-";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
