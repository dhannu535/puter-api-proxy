import React from "react";

export default function Models({ data }) {
  const { models, config, health } = data;
  const tiers = config?.tiers;

  if (!tiers) return <div className="empty-state">Loading models...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Models</h1>
        <p>146 models across 4 cost tiers. Requests fall through tiers until one succeeds.</p>
      </div>

      {/* Summary table */}
      <div className="section">
        <div className="section-title">Tier Summary</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Models</th>
                <th>Cost</th>
                <th>Description</th>
                <th>Tried</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tiers).map(([key, tier], i) => (
                <tr key={key}>
                  <td><span className={`tier-badge ${key}`}>{tier.name}</span></td>
                  <td>{tier.models.length}</td>
                  <td className="mono">{key === "free" ? "$0" : key === "cheap" ? "< $0.20/M" : key === "mid" ? "$0.20–$1.50/M" : "$1.50+/M"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{tier.description}</td>
                  <td>{i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : "Last"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-tier model lists */}
      {Object.entries(tiers).map(([key, tier]) => (
        <div className="tier-section" key={key}>
          <div className="tier-header">
            <span className={`tier-badge ${key}`}>{tier.name}</span>
            <span className="tier-count">{tier.models.length} models</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Requests</th>
                  <th>Success</th>
                  <th>Avg Latency</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tier.models.map((modelId) => {
                  const s = (models || []).find((m) => m.model === modelId);
                  const hp = health?.[modelId];
                  const cooled = hp && hp.failures >= 3;
                  return (
                    <tr key={modelId}>
                      <td className="mono">{modelId}</td>
                      <td>{s ? s.requests : "—"}</td>
                      <td>{s ? s.success : "—"}</td>
                      <td>{s ? `${s.avgLatency}ms` : "—"}</td>
                      <td>{s ? <span className={parseFloat(s.successRate) >= 80 ? "badge-success" : "badge-error"}>{s.successRate}%</span> : "—"}</td>
                      <td>{cooled ? <span className="badge-error">Cooldown</span> : s ? <span className="badge-success">Healthy</span> : <span style={{ color: "var(--text-dim)" }}>Idle</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
