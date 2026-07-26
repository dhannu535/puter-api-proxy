import "dotenv/config";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Router } from "./router.mjs";
import Analytics from "./analytics.mjs";
import { MODEL_TIERS, DEFAULT_FALLBACK_CHAIN, getModelInfo, ROUTING_STRATEGIES } from "./models.mjs";

// Prevent puter.js WebSocket reconnection crashes from killing the process
process.on("uncaughtException", (err) => {
  if (err.message?.includes("call stack") || err.name === "RangeError") {
    console.warn("[puter.js] WebSocket reconnection error suppressed");
    return;
  }
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.warn("[puter.js] Unhandled rejection suppressed:", reason?.message || reason);
});

const require = createRequire(import.meta.url);
const { init } = require("@heyputer/puter.js/src/init.cjs");

// --- Configuration ---
const PORT = parseInt(process.env.PORT || "3800", 10);
const PUTER_TOKEN = process.env.PUTER_AUTH_TOKEN;
const API_KEY = process.env.API_KEY || "sk-puter-proxy";
const DASHBOARD_ENABLED = process.env.DASHBOARD !== "false";

if (!PUTER_TOKEN) {
  console.error("ERROR: Set PUTER_AUTH_TOKEN env var (get one from https://puter.com/dashboard)");
  process.exit(1);
}

const puter = init(PUTER_TOKEN);
const analytics = new Analytics();
const router = new Router(puter, analytics);

// --- Helpers ---
function extractContent(response) {
  const msg = response?.message;
  if (!msg) return typeof response === "string" ? response : JSON.stringify(response);
  const content = msg.content;
  if (Array.isArray(content)) {
    return content.filter((b) => b.type === "text").map((b) => b.text).join("");
  }
  if (typeof content === "string") return content;
  if (content?.toString && content.toString() !== "[object Object]") return content.toString();
  return JSON.stringify(content);
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, anthropic-version, anthropic-beta",
  });
  res.end(body);
}

function sseChunk(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function parseAuth(req) {
  const auth = req.headers["authorization"] || "";
  return auth.replace(/^Bearer\s+/i, "");
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  return JSON.parse(raw);
}

// --- API Routes ---
async function handleChatCompletions(req, res) {
  const body = await readBody(req);
  const { model, messages, stream, temperature, max_tokens, top_p, tools, tool_choice } = body;

  const id = `chatcmpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const created = Math.floor(Date.now() / 1000);

  if (stream) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    try {
      const result = await router.routeChat(messages, {
        model, stream: true, temperature, max_tokens, top_p, tools, tool_choice,
      });

      const routedModel = result.model;
      const response = result.response;

      if (response && typeof response[Symbol.asyncIterator] === "function") {
        for await (const chunk of response) {
          const content = chunk?.text || chunk?.message?.content || "";
          if (content) {
            sseChunk(res, {
              id, object: "chat.completion.chunk", created, model: routedModel,
              choices: [{ index: 0, delta: { content }, finish_reason: null }],
            });
          }
        }
      } else {
        // Fallback: wrap non-streaming response as SSE
        const content = extractContent(response);
        sseChunk(res, {
          id, object: "chat.completion.chunk", created, model: routedModel,
          choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }],
        });
        sseChunk(res, {
          id, object: "chat.completion.chunk", created, model: routedModel,
          choices: [{ index: 0, delta: { content }, finish_reason: null }],
        });
      }

      sseChunk(res, {
        id, object: "chat.completion.chunk", created, model: routedModel,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      });
      res.write("data: [DONE]\n\n");
    } catch (err) {
      sseChunk(res, { error: { message: err.message || "All models failed" } });
    }
    res.end();
  } else {
    // Non-streaming with smart routing
    try {
      const result = await router.routeChat(messages, {
        model, temperature, max_tokens, top_p, tools, tool_choice,
      });

      const content = extractContent(result.response);

      json(res, 200, {
        id, object: "chat.completion", created,
        model: result.model,
        choices: [{
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        _routing: {
          requested: model || "auto",
          routed_to: result.model,
          latency_ms: result.latencyMs,
          attempts: result.attempts,
          fallback_used: result.fallbackUsed,
        },
      });
    } catch (err) {
      json(res, 500, {
        error: { message: err.message || "All models failed", type: "routing_error" },
      });
    }
  }
}

async function handleModels(req, res) {
  try {
    const models = await puter.ai.listModels();
    json(res, 200, {
      object: "list",
      data: models.map((m) => ({
        id: m.id || m.name,
        object: "model",
        created: 0,
        owned_by: m.provider || "puter",
      })),
    });
  } catch (err) {
    // Fallback: return our known model catalog
    const allModels = DEFAULT_FALLBACK_CHAIN.map((id) => ({
      id, object: "model", created: 0, owned_by: "puter",
    }));
    json(res, 200, { object: "list", data: allModels });
  }
}

// --- Dashboard API Routes ---
function handleApiStats(req, res) {
  json(res, 200, analytics.getSummary());
}

function handleApiModelStats(req, res) {
  json(res, 200, analytics.getModelStats());
}

function handleApiTimeline(req, res) {
  json(res, 200, analytics.getTimeline());
}

function handleApiRecentRequests(req, res) {
  json(res, 200, analytics.getRecentRequests());
}

function handleApiHealth(req, res) {
  json(res, 200, router.getHealth());
}

function handleApiConfig(req, res) {
  json(res, 200, {
    port: PORT,
    strategy: router.strategy,
    tiers: MODEL_TIERS,
    strategies: Object.keys(ROUTING_STRATEGIES),
    fallbackChainLength: DEFAULT_FALLBACK_CHAIN.length,
    dashboardEnabled: DASHBOARD_ENABLED,
  });
}

async function handleApiConfigUpdate(req, res) {
  const body = await readBody(req);
  if (body.strategy && ROUTING_STRATEGIES[body.strategy]) {
    router.setStrategy(body.strategy);
  }
  json(res, 200, { ok: true, strategy: router.strategy });
}

function handleApiClearCooldowns(req, res) {
  router.clearCooldowns();
  json(res, 200, { ok: true, message: "All cooldowns cleared" });
}

// --- Anthropic Messages API (Claude Code, Anthropic SDKs) ---
async function handleAnthropicMessages(req, res) {
  const body = await readBody(req);
  const { model, messages, system, max_tokens, temperature, top_p, stream, tools, tool_choice } = body;

  // Convert Anthropic format to OpenAI format
  const openaiMessages = [];
  if (system) {
    openaiMessages.push({ role: "system", content: typeof system === "string" ? system : system.map(b => b.text).join("\n") });
  }
  for (const msg of (messages || [])) {
    openaiMessages.push({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : msg.content.map(b => b.text || "").join(""),
    });
  }

  const id = `msg_${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  if (stream) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    try {
      const result = await router.routeChat(openaiMessages, { model: model || "auto", stream: true, temperature, max_tokens, top_p, tools, tool_choice });
      const response = result.response;

      // message_start
      sseChunk(res, { type: "message_start", message: { id, type: "message", role: "assistant", model: result.model, content: [], usage: { input_tokens: 0, output_tokens: 0 } } });
      sseChunk(res, { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });

      if (response && typeof response[Symbol.asyncIterator] === "function") {
        for await (const chunk of response) {
          const text = chunk?.text || chunk?.message?.content || "";
          if (text) {
            sseChunk(res, { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } });
          }
        }
      } else {
        const text = extractContent(response);
        sseChunk(res, { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } });
      }

      sseChunk(res, { type: "content_block_stop", index: 0 });
      sseChunk(res, { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 0 } });
      sseChunk(res, { type: "message_stop" });
    } catch (err) {
      sseChunk(res, { type: "error", error: { type: "api_error", message: err.message } });
    }
    res.end();
  } else {
    try {
      const result = await router.routeChat(openaiMessages, { model: model || "auto", temperature, max_tokens, top_p, tools, tool_choice });
      const content = extractContent(result.response);

      json(res, 200, {
        id,
        type: "message",
        role: "assistant",
        model: result.model,
        content: [{ type: "text", text: content }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0 },
      });
    } catch (err) {
      json(res, 500, { type: "error", error: { type: "api_error", message: err.message } });
    }
  }
}

// --- Responses API (Codex CLI) ---
async function handleResponses(req, res) {
  const body = await readBody(req);
  const { model, input, instructions, stream, temperature, max_output_tokens } = body;

  // Convert responses format to messages
  const messages = [];
  if (instructions) {
    messages.push({ role: "system", content: instructions });
  }

  // input can be a string or array of message objects
  if (typeof input === "string") {
    messages.push({ role: "user", content: input });
  } else if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") {
        messages.push({ role: "user", content: item });
      } else if (item.role && item.content) {
        messages.push({ role: item.role, content: typeof item.content === "string" ? item.content : item.content.map(b => b.text || b.input || "").join("") });
      }
    }
  }

  const id = `resp_${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  if (stream) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    try {
      const result = await router.routeChat(messages, { model: model || "auto", stream: true, temperature, max_tokens: max_output_tokens });
      const response = result.response;

      // response.created
      sseChunk(res, { type: "response.created", response: { id, object: "response", status: "in_progress", model: result.model, output: [] } });
      sseChunk(res, { type: "response.output_item.added", output_index: 0, item: { type: "message", role: "assistant", content: [] } });
      sseChunk(res, { type: "response.content_part.added", output_index: 0, content_index: 0, part: { type: "output_text", text: "" } });

      if (response && typeof response[Symbol.asyncIterator] === "function") {
        for await (const chunk of response) {
          const text = chunk?.text || chunk?.message?.content || "";
          if (text) {
            sseChunk(res, { type: "response.output_text.delta", output_index: 0, content_index: 0, delta: text });
          }
        }
      } else {
        const text = extractContent(response);
        sseChunk(res, { type: "response.output_text.delta", output_index: 0, content_index: 0, delta: text });
      }

      sseChunk(res, { type: "response.output_text.done", output_index: 0, content_index: 0, text: "" });
      sseChunk(res, { type: "response.content_part.done", output_index: 0, content_index: 0, part: { type: "output_text", text: "" } });
      sseChunk(res, { type: "response.output_item.done", output_index: 0, item: { type: "message", role: "assistant" } });
      sseChunk(res, { type: "response.completed", response: { id, object: "response", status: "completed", model: result.model } });
    } catch (err) {
      sseChunk(res, { type: "error", error: { message: err.message } });
    }
    res.end();
  } else {
    try {
      const result = await router.routeChat(messages, { model: model || "auto", temperature, max_tokens: max_output_tokens });
      const content = extractContent(result.response);

      json(res, 200, {
        id,
        object: "response",
        status: "completed",
        model: result.model,
        output: [{
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: content }],
        }],
        usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
      });
    } catch (err) {
      json(res, 500, { error: { message: err.message } });
    }
  }
}

// --- Static file serving for dashboard ---
function serveDashboard(req, res, urlPath) {
  const dashboardDir = resolve(import.meta.dirname, "../dashboard/dist");

  if (!existsSync(dashboardDir)) {
    // Serve a minimal inline dashboard if not built
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(getInlineDashboard());
    return;
  }

  let filePath = join(dashboardDir, urlPath === "/dashboard" ? "index.html" : urlPath.replace("/dashboard", ""));
  if (!existsSync(filePath) || filePath.endsWith("/")) {
    filePath = join(dashboardDir, "index.html");
  }

  const ext = filePath.split(".").pop();
  const mimeTypes = {
    html: "text/html", js: "application/javascript", css: "text/css",
    json: "application/json", svg: "image/svg+xml", png: "image/png",
  };

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(getInlineDashboard());
  }
}

// --- Server ---
const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, anthropic-version, anthropic-beta",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // Auth check for /v1 routes
  if ((path.startsWith("/v1") || path === "/v1/messages") && API_KEY && API_KEY !== "none") {
    const token = parseAuth(req) || req.headers["x-api-key"] || "";
    if (token !== API_KEY) {
      return json(res, 401, { error: { message: "Invalid API key" } });
    }
  }

  try {
    // OpenAI-compatible API
    if (path === "/v1/chat/completions" && req.method === "POST") {
      await handleChatCompletions(req, res);
    } else if (path === "/v1/models" && req.method === "GET") {
      await handleModels(req, res);
    }
    // Anthropic Messages API (for Claude Code, Anthropic SDKs)
    else if (path === "/v1/messages" && req.method === "POST") {
      await handleAnthropicMessages(req, res);
    }
    // Responses API (for Codex CLI)
    else if (path === "/v1/responses" && req.method === "POST") {
      await handleResponses(req, res);
    }
    // Token counting (Anthropic compat)
    else if (path === "/v1/messages/count_tokens" && req.method === "POST") {
      json(res, 200, { input_tokens: 0 });
    }
    // Dashboard API
    else if (path === "/api/stats" && req.method === "GET") {
      handleApiStats(req, res);
    } else if (path === "/api/models" && req.method === "GET") {
      handleApiModelStats(req, res);
    } else if (path === "/api/timeline" && req.method === "GET") {
      handleApiTimeline(req, res);
    } else if (path === "/api/requests" && req.method === "GET") {
      handleApiRecentRequests(req, res);
    } else if (path === "/api/health" && req.method === "GET") {
      handleApiHealth(req, res);
    } else if (path === "/api/config" && req.method === "GET") {
      handleApiConfig(req, res);
    } else if (path === "/api/config" && req.method === "POST") {
      await handleApiConfigUpdate(req, res);
    } else if (path === "/api/cooldowns/clear" && req.method === "POST") {
      handleApiClearCooldowns(req, res);
    }
    // Health check
    else if (path === "/health" || path === "/") {
      json(res, 200, {
        status: "ok",
        models: DEFAULT_FALLBACK_CHAIN.length,
        strategy: router.strategy,
        provider: "puter.js",
        uptime: Math.floor((Date.now() - analytics.startTime) / 1000),
      });
    }
    // Dashboard
    else if (path.startsWith("/dashboard") || path === "/app") {
      serveDashboard(req, res, path);
    }
    // 404
    else {
      json(res, 404, { error: { message: "Not found" } });
    }
  } catch (err) {
    json(res, 500, { error: { message: err.message || "Internal error" } });
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          🚀 Puter API Proxy with Smart Routing              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  API:        http://localhost:${PORT}/v1/chat/completions${" ".repeat(Math.max(0, 10 - String(PORT).length))}║
║  Models:     http://localhost:${PORT}/v1/models${" ".repeat(Math.max(0, 20 - String(PORT).length))}║
║  Dashboard:  http://localhost:${PORT}/dashboard${" ".repeat(Math.max(0, 18 - String(PORT).length))}║
║                                                              ║
║  API Key:    ${API_KEY}${" ".repeat(Math.max(0, 44 - API_KEY.length))}║
║  Strategy:   ${router.strategy}${" ".repeat(Math.max(0, 44 - router.strategy.length))}║
║  Fallback:   ${DEFAULT_FALLBACK_CHAIN.length} models in chain${" ".repeat(Math.max(0, 30 - String(DEFAULT_FALLBACK_CHAIN.length).length))}║
║                                                              ║
║  Your calls will NEVER fail - auto-fallback across all       ║
║  ${DEFAULT_FALLBACK_CHAIN.length} models until one responds.${" ".repeat(Math.max(0, 35 - String(DEFAULT_FALLBACK_CHAIN.length).length))}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
});

// Inline dashboard when React build isn't available
function getInlineDashboard() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Puter API Proxy - Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e4e4e7; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 1.8rem; margin-bottom: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #71717a; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #1c1c22; border: 1px solid #27272a; border-radius: 12px; padding: 20px; }
    .card h3 { font-size: 0.85rem; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .card .value { font-size: 2rem; font-weight: 700; }
    .card .sub { font-size: 0.8rem; color: #52525b; margin-top: 4px; }
    .success { color: #22c55e; }
    .warning { color: #f59e0b; }
    .info { color: #6366f1; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 1.2rem; margin-bottom: 16px; color: #a1a1aa; }
    table { width: 100%; border-collapse: collapse; background: #1c1c22; border-radius: 12px; overflow: hidden; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #27272a; }
    th { font-size: 0.8rem; color: #71717a; text-transform: uppercase; }
    td { font-size: 0.9rem; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .badge-success { background: #052e16; color: #22c55e; }
    .badge-error { background: #450a0a; color: #ef4444; }
    .config { background: #1c1c22; border: 1px solid #27272a; border-radius: 12px; padding: 20px; font-family: monospace; font-size: 0.85rem; color: #a1a1aa; }
    .config code { color: #6366f1; }
    .refresh-btn { background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .refresh-btn:hover { background: #4f46e5; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Puter API Proxy</h1>
        <p class="subtitle">Smart routing with zero-failure fallback across 500+ models</p>
      </div>
      <button class="refresh-btn" onclick="loadData()">↻ Refresh</button>
    </div>

    <div class="grid" id="stats-grid">
      <div class="card"><h3>Total Requests</h3><div class="value" id="total-requests">-</div></div>
      <div class="card"><h3>Success Rate</h3><div class="value success" id="success-rate">-</div></div>
      <div class="card"><h3>Avg Latency</h3><div class="value info" id="avg-latency">-</div></div>
      <div class="card"><h3>Uptime</h3><div class="value" id="uptime">-</div></div>
    </div>

    <div class="section">
      <h2>Model Performance (24h)</h2>
      <table id="model-table">
        <thead><tr><th>Model</th><th>Requests</th><th>Success</th><th>Avg Latency</th><th>Rate</th></tr></thead>
        <tbody id="model-tbody"></tbody>
      </table>
    </div>

    <div class="section">
      <h2>Recent Requests</h2>
      <table id="requests-table">
        <thead><tr><th>Time</th><th>Requested</th><th>Routed To</th><th>Status</th><th>Latency</th></tr></thead>
        <tbody id="requests-tbody"></tbody>
      </table>
    </div>

    <div class="section">
      <h2>Configuration</h2>
      <div class="config">
        <p>Base URL: <code>http://localhost:${PORT}/v1</code></p>
        <p>API Key: <code>${API_KEY}</code></p>
        <p>Model: <code>auto</code> (or any specific model ID)</p>
        <p>Strategy: <code id="strategy">loading...</code></p>
        <p>Fallback Chain: <code id="chain-length">-</code> models</p>
      </div>
    </div>
  </div>

  <script>
    async function loadData() {
      try {
        const [stats, models, requests, config] = await Promise.all([
          fetch('/api/stats').then(r => r.json()),
          fetch('/api/models').then(r => r.json()),
          fetch('/api/requests').then(r => r.json()),
          fetch('/api/config').then(r => r.json()),
        ]);

        document.getElementById('total-requests').textContent = stats.total.requests;
        document.getElementById('success-rate').textContent = stats.total.successRate + '%';
        document.getElementById('avg-latency').textContent = stats.last1h.avgLatency + 'ms';
        document.getElementById('uptime').textContent = formatUptime(stats.uptime);
        document.getElementById('strategy').textContent = config.strategy;
        document.getElementById('chain-length').textContent = config.fallbackChainLength;

        const modelTbody = document.getElementById('model-tbody');
        modelTbody.innerHTML = models.slice(0, 20).map(m => \`
          <tr>
            <td>\${m.model}</td>
            <td>\${m.requests}</td>
            <td>\${m.success}</td>
            <td>\${m.avgLatency}ms</td>
            <td><span class="badge \${parseFloat(m.successRate) > 80 ? 'badge-success' : 'badge-error'}">\${m.successRate}%</span></td>
          </tr>
        \`).join('');

        const reqTbody = document.getElementById('requests-tbody');
        reqTbody.innerHTML = requests.slice(0, 20).map(r => \`
          <tr>
            <td>\${new Date(r.timestamp).toLocaleTimeString()}</td>
            <td>\${r.requestedModel || 'auto'}</td>
            <td>\${r.model}</td>
            <td><span class="badge \${r.success ? 'badge-success' : 'badge-error'}">\${r.success ? 'OK' : 'FAIL'}</span></td>
            <td>\${r.latencyMs || '-'}ms</td>
          </tr>
        \`).join('');
      } catch(e) { console.error('Failed to load data:', e); }
    }

    function formatUptime(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
    }

    loadData();
    setInterval(loadData, 10000);
  </script>
</body>
</html>`;
}
