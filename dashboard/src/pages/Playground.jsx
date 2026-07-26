import React, { useState } from "react";

export default function Playground({ config }) {
  const [prompt, setPrompt] = useState("Explain quantum computing in 2 sentences.");
  const [model, setModel] = useState("auto");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer sk-puter-proxy" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setResponse(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Playground</h1>
        <p>Test the smart routing API. Choose a model or use "auto" to let the router pick the best free option.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 14 }}>
        <select value={model} onChange={(e) => setModel(e.target.value)} className="select">
          <optgroup label="Smart Routing">
            <option value="auto">auto — free-first smart routing (recommended)</option>
          </optgroup>
          <optgroup label="Free Models ($0)">
            <option value="openrouter:nvidia/nemotron-3-ultra-550b-a55b:free">NVIDIA Nemotron Ultra 550B (free)</option>
            <option value="openrouter:nvidia/nemotron-3-super-120b-a12b:free">NVIDIA Nemotron Super 120B (free)</option>
            <option value="openrouter:google/gemma-4-31b-it:free">Google Gemma 4 31B (free)</option>
            <option value="openrouter:poolside/laguna-m.1:free">Poolside Laguna M.1 (free)</option>
            <option value="openrouter:openai/gpt-oss-20b:free">OpenAI GPT-OSS 20B (free)</option>
          </optgroup>
          <optgroup label="Cheap (saves allowance)">
            <option value="glm-4.5-flash">GLM-4.5 Flash (Z.AI)</option>
            <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="qwen-flash">Qwen Flash</option>
            <option value="gpt-5-nano">GPT-5 Nano</option>
          </optgroup>
          <optgroup label="Mid-Range">
            <option value="qwen3-235b-a22b">Qwen3 235B (MoE)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
            <option value="minimax-m3">MiniMax M3</option>
            <option value="grok-4-fast">Grok 4 Fast</option>
          </optgroup>
          <optgroup label="Premium (uses more allowance)">
            <option value="claude-opus-5">Claude Opus 5</option>
            <option value="gpt-5.6-sol">GPT-5.6 Sol</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="grok-4.5">Grok 4.5</option>
            <option value="kimi-k3">Kimi K3</option>
          </optgroup>
        </select>
        <button onClick={send} disabled={loading} className="btn btn-primary" style={{ whiteSpace: "nowrap", opacity: loading ? 0.6 : 1 }}>
          {loading ? "⏳ Routing..." : "Send →"}
        </button>
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="textarea" rows={4} placeholder="Enter your message..." />

      {error && (
        <div style={{ marginTop: 16, padding: 14, background: "var(--red-bg)", border: "1px solid #7f1d1d", borderRadius: 8, color: "#fca5a5", fontSize: "0.85rem" }}>
          Error: {error}
        </div>
      )}

      {response && (
        <div className="response-box">
          <div className="response-meta">
            <span>Routed to: <strong style={{ color: "var(--purple)" }}>{response.model}</strong></span>
            {response._routing && (
              <>
                <span>Latency: <strong>{response._routing.latency_ms}ms</strong></span>
                <span>Attempts: <strong>{response._routing.attempts}</strong></span>
                {response._routing.fallback_used && <span className="badge-warn">FALLBACK USED</span>}
              </>
            )}
          </div>
          <div className="response-content">{response.choices?.[0]?.message?.content || "No content"}</div>
        </div>
      )}

      {/* Instruction card */}
      <div className="section" style={{ marginTop: 32 }}>
        <div className="section-title">How Routing Works</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Model Input</th><th>Behavior</th><th>Cost</th></tr></thead>
            <tbody>
              <tr><td className="mono">"auto"</td><td>Tries free models first, then cheap, mid, premium</td><td><span className="badge-success">$0 unless all free fail</span></td></tr>
              <tr><td className="mono">"claude-opus-5"</td><td>Tries Claude Opus 5 first, falls back through all 145 others</td><td><span className="badge-warn">Uses allowance</span></td></tr>
              <tr><td className="mono">"glm-4.5-flash"</td><td>Tries GLM Flash (free on Puter), falls back if unavailable</td><td><span className="badge-success">Near $0</span></td></tr>
              <tr><td className="mono">"openrouter:nvidia/..."</td><td>Uses free OpenRouter model directly, full fallback chain</td><td><span className="badge-success">$0</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
