import React from "react";

export default function Analytics({ data }) {
  const { requests, models, stats, timeline } = data;

  if (!stats) return <div className="empty-state">Loading analytics...</div>;

  const totalSuccess = stats.total.success;
  const totalFail = stats.total.failures;
  const successPct = stats.total.requests > 0 ? (totalSuccess / stats.total.requests) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Request performance, model leaderboard, and routing history</p>
      </div>

      {/* Top row: donut + stats */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, marginBottom: 32 }}>
        <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 24, padding: 24 }}>
          <DonutChart value={successPct} />
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: 4 }}>Overall Success</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--green)" }}>{totalSuccess} OK</div>
            {totalFail > 0 && <div style={{ fontSize: "0.8rem", color: "var(--red)" }}>{totalFail} failures (auto-recovered)</div>}
          </div>
        </div>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <div className="label">Requests (24h)</div>
            <div className="value">{stats.last24h.requests}</div>
          </div>
          <div className="stat-card">
            <div className="label">Avg Latency (24h)</div>
            <div className="value" style={{ color: "var(--accent)" }}>{stats.last24h.avgLatency}ms</div>
          </div>
          <div className="stat-card">
            <div className="label">P95 Latency (24h)</div>
            <div className="value" style={{ color: "var(--yellow)" }}>{stats.last24h.p95Latency}ms</div>
          </div>
        </div>
      </div>

      {/* Model Leaderboard */}
      <div className="section">
        <div className="section-title">Model Leaderboard (24h) <span className="badge">{(models || []).length} active</span></div>
        {models && models.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Model</th>
                  <th>Requests</th>
                  <th>Success</th>
                  <th>Failures</th>
                  <th>Avg Latency</th>
                  <th>Success Rate</th>
                  <th>Bar</th>
                </tr>
              </thead>
              <tbody>
                {models.slice(0, 30).map((m, i) => {
                  const maxReqs = models[0]?.requests || 1;
                  const barWidth = (m.requests / maxReqs) * 100;
                  return (
                    <tr key={m.model}>
                      <td style={{ color: "var(--text-dim)" }}>{i + 1}</td>
                      <td className="mono">{m.model}</td>
                      <td><strong>{m.requests}</strong></td>
                      <td>{m.success}</td>
                      <td>{m.failures > 0 ? <span style={{ color: "var(--red)" }}>{m.failures}</span> : <span style={{ color: "var(--text-dim)" }}>0</span>}</td>
                      <td>{m.avgLatency}ms</td>
                      <td><span className={parseFloat(m.successRate) >= 80 ? "badge-success" : "badge-error"}>{m.successRate}%</span></td>
                      <td style={{ width: 120 }}>
                        <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${barWidth}%`, background: parseFloat(m.successRate) >= 80 ? "var(--accent)" : "var(--red)", borderRadius: 3, transition: "width 0.3s" }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No requests yet. Send some requests to see the leaderboard.</div>
        )}
      </div>

      {/* Recent Requests Log */}
      <div className="section">
        <div className="section-title">Request Log <span className="badge">Recent 30</span></div>
        {requests && requests.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Requested</th>
                  <th>Routed To</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Attempts</th>
                  <th>Stream</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 30).map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                    <td className="mono">{r.requestedModel || "auto"}</td>
                    <td className="mono">{r.model}</td>
                    <td><span className={r.success ? "badge-success" : "badge-error"}>{r.success ? "OK" : "FAIL"}</span></td>
                    <td>{r.latencyMs || "—"}ms</td>
                    <td>{r.attempts || 1}</td>
                    <td>{r.stream ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No requests yet.</div>
        )}
      </div>
    </div>
  );
}

function DonutChart({ value }) {
  const size = 100;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="donut-chart" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--green)" strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div className="center-label">
        <div className="center-value">{Math.round(value)}%</div>
        <div className="center-text">success</div>
      </div>
    </div>
  );
}
