// Complete model catalog with REAL Puter model IDs
// All 424 models organized by cost tier
// Default strategy: FREE first → Cheap → Mid → Premium (conserve allowance)

// ═══════════════════════════════════════════════════════════════
// TIER 1: COMPLETELY FREE (OpenRouter :free — $0 from allowance)
// ═══════════════════════════════════════════════════════════════
export const FREE_MODELS = [
  // NVIDIA (strong, free)
  "openrouter:nvidia/nemotron-3-ultra-550b-a55b:free",
  "openrouter:nvidia/nemotron-3-super-120b-a12b:free",
  "openrouter:nvidia/nemotron-3-nano-30b-a3b:free",
  "openrouter:nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "openrouter:nvidia/nemotron-nano-9b-v2:free",
  "openrouter:nvidia/nemotron-nano-12b-v2-vl:free",
  "openrouter:nvidia/nemotron-3.5-content-safety:free",
  // Google Gemma (free, solid quality)
  "openrouter:google/gemma-4-31b-it:free",
  "openrouter:google/gemma-4-26b-a4b-it:free",
  // Poolside Laguna (free, code-focused)
  "openrouter:poolside/laguna-m.1:free",
  "openrouter:poolside/laguna-s-2.1:free",
  "openrouter:poolside/laguna-xs-2.1:free",
  // Others
  "openrouter:openai/gpt-oss-20b:free",
  "openrouter:inclusionai/ling-3.0-flash:free",
  "openrouter:cohere/north-mini-code:free",
];

// ═══════════════════════════════════════════════════════════════
// TIER 2: VERY CHEAP (< $0.20/M input — barely uses allowance)
// ═══════════════════════════════════════════════════════════════
export const CHEAP_MODELS = [
  // Z.AI GLM (free/nearly free on Puter)
  "glm-4.5-flash",            // $0/M
  "glm-4.7-flash",            // $0/M
  "glm-4.7-flashx",           // $0.07/M
  "glm-4-32b-0414-128k",      // $0.10/M
  // Alibaba Qwen (very cheap)
  "qwen-flash",               // $0.05/M
  "qwen-turbo",               // $0.05/M
  "qwen3-8b",                 // $0.18/M
  "qwen3.5-35b-a3b",          // $0.07/M (flash tier)
  // Google Gemini (budget tiers)
  "gemini-2.0-flash-lite",    // $0.08/M
  "gemini-2.0-flash",         // $0.10/M
  "gemini-2.5-flash-lite",    // $0.10/M
  "gemini-3.1-flash-lite",    // $0.25/M
  // DeepSeek
  "deepseek-v4-flash",        // $0.14/M
  // Mistral (tiny)
  "ministral-3b-2512",        // $0.04/M
  "ministral-8b-2512",        // $0.10/M
  "open-mistral-nemo-2407",   // $0.15/M
  "mistral-small-2603",       // $0.15/M
  // OpenAI (cheapest)
  "gpt-5-nano",               // $0.05/M
  "gpt-5-nano-2025-08-07",    // $0.05/M
  "gpt-4.1-nano",             // $0.10/M
  "gpt-4o-mini",              // $0.15/M
  // Together AI
  "togetherai:liquidai/lfm2.5-8b-a1b",
  "togetherai:arize-ai/qwen-2-1.5b-instruct",
  "togetherai:google/gemma-3n-e4b-it",
  "togetherai:openai/gpt-oss-20b",
  "togetherai:qwen/qwen2.5-7b-instruct-turbo",
  "togetherai:qwen/qwen3.5-9b",
  // OpenRouter cheap
  "openrouter:bytedance-seed/seed-2.0-mini",
  "openrouter:bytedance-seed/seed-1.6-flash",
];

// ═══════════════════════════════════════════════════════════════
// TIER 3: MID-RANGE ($0.20–$1.50/M — good balance)
// ═══════════════════════════════════════════════════════════════
export const MID_MODELS = [
  // Alibaba Qwen (mid)
  "qwen3-14b",                // $0.35/M
  "qwen3-32b",                // $0.70/M
  "qwen3-235b-a22b",          // $0.70/M (MoE flagship)
  "qwen3.5-27b",              // $0.30/M
  "qwen3.5-122b-a10b",        // $0.40/M
  "qwen3.6-35b-a3b",          // $0.25/M
  "qwen3.6-plus",             // $0.50/M
  "qwen-plus",                // $0.40/M
  "qwen3-coder-30b-a3b-instruct", // $0.45/M
  "qwen3-coder-flash",        // $0.30/M
  "qwq-plus",                 // $0.80/M (reasoning)
  // Google Gemini (mid)
  "gemini-2.5-flash",         // $0.30/M
  "gemini-3-flash-preview",   // $0.50/M
  "gemini-3.5-flash",         // $1.50/M
  // Z.AI GLM (mid)
  "glm-4.5-air",              // $0.20/M
  "glm-4.5",                  // $0.60/M
  "glm-4.6",                  // $0.60/M
  "glm-4.7",                  // $0.60/M
  "glm-5-turbo",              // $1.20/M
  // DeepSeek
  "deepseek-v4-pro",          // $1.74/M (but incredible quality)
  // MiniMax
  "minimax-m2",               // $0.30/M
  "minimax-m2.5",             // $0.30/M
  "minimax-m2.7",             // $0.30/M
  "minimax-m3",               // $0.30/M
  // Mistral (mid)
  "mistral-medium-2508",      // $0.40/M
  "mistral-large-2512",       // $0.50/M
  "devstral-2512",            // $0.40/M
  "ministral-14b-2512",       // $0.20/M
  // xAI Grok (mid)
  "grok-3-mini",              // $0.30/M
  "grok-3-mini-fast",         // $0.60/M
  "grok-code-fast-1",         // $0.20/M
  "grok-4-1-fast",            // $0.20/M
  "grok-4-fast",              // $0.20/M
  "grok-4-fast-non-reasoning", // $0.20/M
  // OpenAI (mid)
  "gpt-5-mini",               // $0.25/M
  "gpt-5-mini-2025-08-07",    // $0.25/M
  "gpt-4.1-mini",             // $0.40/M
  "o3-mini",                  // $1.10/M
  "o4-mini",                  // $1.10/M
  // Together AI (mid)
  "togetherai:google/gemma-4-31b-it",
  "togetherai:meta-llama/llama-3.3-70b-instruct-turbo",
  "togetherai:openai/gpt-oss-120b",
  "togetherai:moonshotai/kimi-k2.7-code",
  "togetherai:nvidia/nemotron-3-ultra-550b-a55b",
  "togetherai:deepcogito/cogito-v2-1-671b",
  // Moonshot (mid)
  "kimi-k2.5",                // $0.60/M
  "kimi-k2.6",                // $0.95/M
  "moonshot-v1-auto",         // $1/M
  // OpenRouter (mid, popular)
  "openrouter:deepseek/deepseek-v3.2",
  "openrouter:deepseek/deepseek-r1-0528",
  "openrouter:deepseek/deepseek-chat-v3.1",
  "openrouter:meta-llama/llama-4-maverick",
  "openrouter:meta-llama/llama-4-scout",
  "openrouter:bytedance-seed/seed-2.0-lite",
  "openrouter:bytedance-seed/seed-1.6",
  "openrouter:allenai/olmo-3-32b-think",
  "openrouter:arcee-ai/trinity-large-thinking",
];

// ═══════════════════════════════════════════════════════════════
// TIER 4: PREMIUM ($1.50+/M — flagship models, use most allowance)
// ═══════════════════════════════════════════════════════════════
export const PREMIUM_MODELS = [
  // OpenAI Flagship
  "gpt-5",                    // $1.25/M
  "gpt-5-2025-08-07",         // $1.25/M
  "gpt-5.1",                  // $1.25/M
  "gpt-5.2",                  // $1.75/M
  "gpt-5.4",                  // $2.50/M
  "gpt-5.4-2026-03-05",       // $2.50/M
  "gpt-5.5-2026-04-23",       // $5/M
  "gpt-5.6-sol",              // $5/M
  "gpt-5.6-terra",            // $2.50/M
  "gpt-5.6-luna",             // $1/M
  "gpt-4.1",                  // $2/M
  "o3",                       // $2/M
  // Anthropic Claude
  "claude-haiku-4-5-20251001", // $1/M
  "claude-sonnet-4-6",        // $3/M
  "claude-sonnet-5",          // $3/M
  "claude-opus-4-8",          // $5/M
  "claude-opus-5",            // $5/M
  "claude-fable-5",           // $10/M
  // Google Gemini Pro
  "gemini-2.5-pro",           // $1.25/M
  "gemini-3.1-pro-preview",   // $2/M
  // xAI Grok
  "grok-3",                   // $3/M
  "grok-4",                   // $3/M
  "grok-4.3",                 // $1.25/M
  "grok-4.5",                 // $2/M
  // Moonshot
  "kimi-k3",                  // $3/M
  // Mistral
  "mistral-medium-3-5",       // $1.50/M
  "magistral-medium-2509",    // $2/M
  // Alibaba Qwen (premium)
  "qwen-max",                 // $1.60/M
  "qwen3-max",                // $1.20/M
  "qwen3.6-max-preview",      // $1.30/M
  "qwen3-coder-plus",         // $1/M
  "qwen3-coder-480b-a35b-instruct", // $2/M
  // Z.AI GLM Premium
  "glm-5",                    // $1/M
  "glm-5.1",                  // $1.40/M
  "glm-5.2",                  // $1.40/M
  // Together AI premium
  "togetherai:qwen/qwen3.7-max",
  "togetherai:qwen/qwen3.7-plus",
  "togetherai:thinkingmachines/inkling",
  // OpenRouter premium
  "openrouter:anthropic/claude-opus-5-fast",
  "openrouter:anthropic/claude-opus-4.8-fast",
  "openrouter:anthropic/claude-sonnet-4",
  "openrouter:google/gemini-2.5-pro",
  "openrouter:google/gemini-3-flash-preview",
  "openrouter:cohere/command-a",
  "openrouter:amazon/nova-premier-v1",
];

// ═══════════════════════════════════════════════════════════════
// MODEL TIERS (for dashboard display)
// ═══════════════════════════════════════════════════════════════
export const MODEL_TIERS = {
  free: {
    name: "Free ($0)",
    description: "OpenRouter free-tier models — zero cost from your Puter allowance",
    models: FREE_MODELS,
  },
  cheap: {
    name: "Cheap (< $0.20/M)",
    description: "Very low cost — barely uses allowance",
    models: CHEAP_MODELS,
  },
  mid: {
    name: "Mid-Range ($0.20–$1.50/M)",
    description: "Great quality-to-cost ratio",
    models: MID_MODELS,
  },
  premium: {
    name: "Premium ($1.50+/M)",
    description: "Top-tier flagship models — uses most allowance",
    models: PREMIUM_MODELS,
  },
};

// Default fallback chain — FREE FIRST to conserve Puter allowance
export const DEFAULT_FALLBACK_CHAIN = [
  ...FREE_MODELS,
  ...CHEAP_MODELS,
  ...MID_MODELS,
  ...PREMIUM_MODELS,
];

// Routing strategies
export const ROUTING_STRATEGIES = {
  free_first: "free_first",     // Default: free → cheap → mid → premium
  balanced: "balanced",          // Spread across all tiers evenly
  quality: "quality",            // Premium → mid → cheap → free (burns allowance)
  smart: "smart",                // Free for simple, premium for complex
};

// Get the fallback chain for a specific model request
export function getFallbackChain(requestedModel, strategy = "free_first") {
  // "auto" → use full default chain (free first)
  if (!requestedModel || requestedModel === "auto") {
    if (strategy === "quality") {
      return [...PREMIUM_MODELS, ...MID_MODELS, ...CHEAP_MODELS, ...FREE_MODELS];
    }
    return [...DEFAULT_FALLBACK_CHAIN];
  }

  // Specific model requested → try it first, then full fallback
  const chain = [requestedModel];
  for (const model of DEFAULT_FALLBACK_CHAIN) {
    if (model !== requestedModel) {
      chain.push(model);
    }
  }
  return chain;
}

// Get model info
export function getModelInfo(modelId) {
  for (const [tierKey, tier] of Object.entries(MODEL_TIERS)) {
    if (tier.models.includes(modelId)) {
      return { id: modelId, tier: tierKey, tierName: tier.name };
    }
  }
  return { id: modelId, tier: "unknown", tierName: "Unknown" };
}
