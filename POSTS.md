# Promotional Posts

Use these to share the project. Copy-paste ready.

---

## Show HN (Hacker News)

**Title:** Show HN: I built a proxy that gives you 424 AI models (Claude, GPT-5.6, Gemini) with auto-fallback

**Text:**
I built an OpenAI-compatible proxy that routes through 424 AI models via Puter.js with smart fallback. If one model fails or is rate-limited, it instantly tries the next — up to 20 models per request.

The key insight: Puter gives every account a free monthly allowance, and OpenRouter has 15 completely free models (NVIDIA Nemotron 550B, Gemma 4, Poolside Laguna). The proxy tries free models first, so most requests cost $0.

Works with any OpenAI-compatible client — just change base_url. I use it with Claude Code, Cursor, and Aider daily.

Features:
- 4 cost tiers: Free (15) → Cheap (28) → Mid (55) → Premium (48)
- Anthropic Messages API (Claude Code) + Responses API (Codex CLI)
- React dashboard with analytics
- Docker one-command deploy
- Sticky sessions for multi-turn conversations

https://github.com/dhannu535/puter-api-proxy

---

## Reddit (r/LocalLLaMA or r/selfhosted)

**Title:** I built a self-hosted proxy that gives you 424 AI models (Claude Opus 5, GPT-5.6, Gemini 3.5, DeepSeek V4) with auto-fallback — 15 models are completely free

**Text:**
Hey everyone,

I built an OpenAI-compatible API proxy that routes requests across 424 AI models with smart fallback. If one model fails, it instantly tries the next. Your calls basically never fail.

**How it works:**
- Powered by Puter.js (free account gives you a monthly allowance)
- 15 models are completely free via OpenRouter (NVIDIA Nemotron Ultra 550B, Gemma 4 31B, Poolside Laguna, GPT-OSS 20B)
- Default routing tries free models first, only escalates to paid if needed
- Supports OpenAI, Anthropic, and Responses API formats

**Works with:**
- Claude Code
- Codex CLI
- Cursor
- Continue
- Cline / Roo Code
- Aider
- Hermes
- Any OpenAI-compatible client

**Setup:**
```bash
git clone https://github.com/dhannu535/puter-api-proxy.git
cd puter-api-proxy
cp .env.example .env  # add your free Puter token
docker compose up -d
```

Then point any client at `http://localhost:3800/v1` with API key `sk-puter-proxy`.

Includes a React dashboard with analytics, model health tracking, and a playground.

GitHub: https://github.com/dhannu535/puter-api-proxy

Would love feedback. What models/features would you want added?

---

## Reddit (r/ChatGPT)

**Title:** Free access to 424 AI models (GPT-5.6, Claude Opus 5, Gemini, DeepSeek) through one endpoint — self-hosted proxy with smart fallback

**Text:**
Made a self-hosted proxy that gives you access to 424 AI models through a single OpenAI-compatible endpoint. It automatically tries free models first and falls back through paid models only if needed.

15 models are completely free (via OpenRouter's free tier). The rest use your Puter account's free monthly allowance.

Takes 2 minutes to set up. Docker or npm start.

https://github.com/dhannu535/puter-api-proxy

---

## Twitter/X

**Post 1 (main):**
I built a proxy that gives you 424 AI models through one endpoint:

⚡ Claude Opus 5, GPT-5.6, Gemini 3.5, Grok 4.5, DeepSeek V4...

🆓 15 models completely free
🔄 Auto-fallback: if one fails, tries next instantly
🐳 Docker one-command deploy
🖥️ Works with Claude Code, Cursor, Aider

https://github.com/dhannu535/puter-api-proxy

**Post 2 (thread):**
How it works:

1. You get a free Puter token (puter.com/dashboard)
2. Start the proxy (docker compose up -d)
3. Point any OpenAI client at localhost:3800/v1
4. It tries free models first → cheap → mid → premium
5. Up to 20 models per request, 30s budget

Your calls basically never fail. And it's mostly free.

**Post 3 (thread):**
Supports:
- /v1/chat/completions (OpenAI)
- /v1/messages (Anthropic/Claude Code)
- /v1/responses (Codex CLI)

Works with Cursor, Continue, Cline, Aider, Hermes, LangChain — anything that speaks OpenAI format.

Dashboard included with charts + model analytics.

---

## Dev.to / Hashnode blog title ideas

- "How I Get Free Access to 424 AI Models (GPT-5.6, Claude, Gemini) Through One Endpoint"
- "Build Your Own AI Router: Smart Fallback Across 424 Models for $0"
- "I Built a Self-Hosted Alternative to OpenAI's API That Never Fails"
