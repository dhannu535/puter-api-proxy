// Smart router with aggressive fallback - your calls should NEVER fail
import { getFallbackChain } from "./models.mjs";

const MAX_RETRIES = 20; // Try up to 20 different models before giving up
const RETRY_TIMEOUT_MS = 30000; // Total wall-clock budget: 30s
const COOLDOWN_MS = 60000; // Cool down a model for 60s after failure
const STICKY_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// In-memory state
const modelHealth = new Map(); // modelId -> { failures, lastFailure, avgLatency, successCount }
const stickySessions = new Map(); // sessionKey -> { model, lastUsed }

export class Router {
  constructor(puter, analytics) {
    this.puter = puter;
    this.analytics = analytics;
    this.strategy = "priority";
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  getHealth() {
    const health = {};
    for (const [model, data] of modelHealth) {
      health[model] = { ...data };
    }
    return health;
  }

  clearCooldowns() {
    modelHealth.clear();
  }

  // Get or create a session key for sticky routing
  getSessionKey(messages) {
    if (!messages || messages.length === 0) return null;
    // Use first user message as session fingerprint
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return null;
    const content = typeof firstUser.content === "string"
      ? firstUser.content
      : JSON.stringify(firstUser.content);
    // Simple hash
    let hash = 0;
    for (let i = 0; i < Math.min(content.length, 200); i++) {
      hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
    }
    return `session_${hash}`;
  }

  // Check if a model is currently on cooldown
  isOnCooldown(modelId) {
    const health = modelHealth.get(modelId);
    if (!health) return false;
    if (health.failures >= 3 && Date.now() - health.lastFailure < COOLDOWN_MS) {
      return true;
    }
    return false;
  }

  // Record a success
  recordSuccess(modelId, latencyMs) {
    const health = modelHealth.get(modelId) || { failures: 0, lastFailure: 0, avgLatency: 0, successCount: 0 };
    health.successCount++;
    health.failures = Math.max(0, health.failures - 1); // Decay failures on success
    health.avgLatency = health.avgLatency
      ? (health.avgLatency * 0.8 + latencyMs * 0.2)
      : latencyMs;
    modelHealth.set(modelId, health);
  }

  // Record a failure
  recordFailure(modelId) {
    const health = modelHealth.get(modelId) || { failures: 0, lastFailure: 0, avgLatency: 0, successCount: 0 };
    health.failures++;
    health.lastFailure = Date.now();
    modelHealth.set(modelId, health);
  }

  // Route a chat completion request with aggressive fallback
  async routeChat(messages, opts = {}) {
    const { model, stream, temperature, max_tokens, top_p, tools, tool_choice } = opts;
    const startTime = Date.now();
    const chain = getFallbackChain(model, this.strategy);
    const attempts = [];
    let lastError = null;

    // Check sticky session
    const sessionKey = this.getSessionKey(messages);
    if (sessionKey) {
      const sticky = stickySessions.get(sessionKey);
      if (sticky && Date.now() - sticky.lastUsed < STICKY_SESSION_TTL_MS) {
        // Move sticky model to front of chain
        const idx = chain.indexOf(sticky.model);
        if (idx > 0) {
          chain.splice(idx, 1);
          chain.unshift(sticky.model);
        }
      }
    }

    for (let i = 0; i < Math.min(chain.length, MAX_RETRIES); i++) {
      // Check wall-clock budget
      if (Date.now() - startTime > RETRY_TIMEOUT_MS) {
        break;
      }

      const candidateModel = chain[i];

      // Skip models on cooldown
      if (this.isOnCooldown(candidateModel)) {
        attempts.push({ model: candidateModel, status: "skipped_cooldown" });
        continue;
      }

      try {
        const callStart = Date.now();
        const callOpts = { model: candidateModel };
        if (temperature !== undefined) callOpts.temperature = temperature;
        if (max_tokens !== undefined) callOpts.max_tokens = max_tokens;
        if (top_p !== undefined) callOpts.top_p = top_p;
        if (stream) callOpts.stream = true;
        if (tools) callOpts.tools = tools;
        if (tool_choice) callOpts.tool_choice = tool_choice;

        const response = await this.puter.ai.chat(messages, callOpts);
        const latency = Date.now() - callStart;

        // Record success
        this.recordSuccess(candidateModel, latency);

        // Update sticky session
        if (sessionKey) {
          stickySessions.set(sessionKey, { model: candidateModel, lastUsed: Date.now() });
        }

        // Log to analytics
        if (this.analytics) {
          this.analytics.logRequest({
            model: candidateModel,
            requestedModel: model || "auto",
            success: true,
            latencyMs: latency,
            attempts: attempts.length + 1,
            stream: !!stream,
          });
        }

        return {
          response,
          model: candidateModel,
          latencyMs: latency,
          attempts: attempts.length + 1,
          fallbackUsed: i > 0,
        };
      } catch (err) {
        const latency = Date.now() - callStart;
        this.recordFailure(candidateModel);
        attempts.push({
          model: candidateModel,
          status: "failed",
          error: err.message,
          latencyMs: latency,
        });
        lastError = err;

        // Log failed attempt
        if (this.analytics) {
          this.analytics.logRequest({
            model: candidateModel,
            requestedModel: model || "auto",
            success: false,
            latencyMs: latency,
            error: err.message,
            stream: !!stream,
          });
        }
      }
    }

    // All retries exhausted - this should be extremely rare
    throw new Error(
      `All ${attempts.length} models failed. Last error: ${lastError?.message || "unknown"}. ` +
      `Attempts: ${attempts.map((a) => `${a.model}(${a.status})`).join(", ")}`
    );
  }

  // Route a streaming chat completion
  async routeStreamingChat(messages, opts = {}) {
    // Same logic but with stream: true
    return this.routeChat(messages, { ...opts, stream: true });
  }
}

// Cleanup stale sticky sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of stickySessions) {
    if (now - session.lastUsed > STICKY_SESSION_TTL_MS) {
      stickySessions.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
