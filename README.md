# ⚡ Puter API Proxy

**One endpoint. 146 models. Zero failures. $0 cost.**

An OpenAI-compatible API proxy that gives you free access to 500+ AI models (GPT-5.6, Claude Opus 5, Gemini 3.5, Grok 4.5, DeepSeek V4, Qwen3, and more) through smart routing with automatic fallback. If one model fails, it instantly tries the next — your calls **never** fail.

---

## 🎯 What This Does

```
Your App  →  Puter Proxy  →  146 models (free first, then paid)
              ↓ fail?
              Try next model automatically
              ↓ fail again?
              Keep trying (up to 20 models)
              ↓
              ✅ Always returns a response
```

- 🆓 **15 completely free models** tried first (NVIDIA Nemotron, Gemma 4, Poolside Laguna)
- 💰 **28 cheap models** as second fallback (GLM Flash, DeepSeek V4 Flash, Gemini Flash)
- 🧠 **55 mid-range models** (Qwen3 235B, MiniMax M3, Grok 4 Fast)
- 👑 **48 premium models** as last resort (Claude Opus 5, GPT-5.6 Sol, Gemini Pro)
- 📊 **Admin dashboard** with real-time charts, tables, and playground
- 🐳 **Docker ready** — one command to deploy

---

## 🚀 Quick Start

### 1️⃣ Get Your Puter Token (free)

Go to **https://puter.com/dashboard** → Sign up → Copy your auth token.

### 2️⃣ Clone & Run

```bash
git clone https://github.com/YOUR_USERNAME/puter-api-proxy.git
cd puter-api-proxy
npm install
```

### 3️⃣ Set Your Token

```bash
cp .env.example .env
# Edit .env and paste your PUTER_AUTH_TOKEN
```

### 4️⃣ Start the Server

```bash
npm start
```

That's it! Your proxy is live at `http://localhost:3800` 🎉

---

## 🐳 Docker (Recommended)

```bash
# One command to run everything
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild after changes
docker compose up -d --build
```

---

## 🔌 How to Use

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3800/v1",
    api_key="sk-puter-proxy",
)

# "auto" = free-first smart routing (recommended)
resp = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hello!"}],
)

print(resp.choices[0].message.content)
print(f"Model used: {resp.model}")
```

### Node.js

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:3800/v1",
  apiKey: "sk-puter-proxy",
});

const resp = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(resp.choices[0].message.content);
console.log(`Model: ${resp.model}`);
```

### curl

```bash
curl http://localhost:3800/v1/chat/completions \
  -H "Authorization: Bearer sk-puter-proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Streaming

```bash
curl http://localhost:3800/v1/chat/completions \
  -H "Authorization: Bearer sk-puter-proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "stream": true,
    "messages": [{"role": "user", "content": "Write a haiku"}]
  }'
```

---

## 🧩 Works With

| Client | Setup |
|--------|-------|
| 🐍 **Python OpenAI SDK** | `base_url="http://localhost:3800/v1"` |
| 📦 **Node.js OpenAI SDK** | `baseURL: "http://localhost:3800/v1"` |
| 🦜 **LangChain** | `ChatOpenAI(base_url="http://localhost:3800/v1")` |
| 💻 **Cursor** | Settings → OpenAI API Base → `http://localhost:3800/v1` |
| 🔧 **Cline / Roo Code** | Provider: OpenAI Compatible, Base URL: `http://localhost:3800/v1` |
| ▶️ **Continue** | `apiBase: http://localhost:3800/v1` |
| 🛠️ **Aider** | `OPENAI_API_BASE=http://localhost:3800/v1 aider` |
| 🌐 **Any OpenAI client** | Just change `base_url` and `api_key` |

---

## 📊 Dashboard

Open **http://localhost:3800/dashboard** in your browser.

**Features:**
- 📈 Real-time request volume chart (24h)
- 🍩 Success rate donut chart
- 📋 Model leaderboard with per-model stats
- 🧪 Interactive playground to test models
- 📜 Request log with routing details
- ⚙️ Strategy picker & configuration

---

## 🎛️ Model Selection

| Model Input | Behavior | Cost |
|-------------|----------|------|
| `"auto"` | Free models first, then escalates | 💚 $0 unless all free fail |
| `"claude-opus-5"` | Tries Claude first, falls back through all 145 others | 💛 Uses allowance |
| `"glm-4.5-flash"` | Tries GLM Flash (free on Puter), then falls back | 💚 ~$0 |
| `"openrouter:nvidia/nemotron-3-ultra-550b-a55b:free"` | Free OpenRouter model | 💚 $0 |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────┐
│  Your App       │────▶│  Puter API Proxy (:3800)                 │
│  (any OpenAI    │◀────│                                          │
│   client)       │     │  Router picks best available model:      │
└─────────────────┘     │    1. Free tier (15 models, $0)          │
                        │    2. Cheap tier (28 models, <$0.20/M)   │
                        │    3. Mid tier (55 models, $0.20-1.50/M) │
                        │    4. Premium tier (48 models, $1.50+/M) │
                        │                                          │
                        │  On failure → try next model instantly   │
                        │  Up to 20 retries per request            │
                        │  30s wall-clock budget                   │
                        └──────────────────────────────────────────┘
                                         │
                    ┌────────────────────────────────────────┐
                    │          Puter.js (500+ models)        │
                    │  OpenAI · Anthropic · Google · xAI     │
                    │  DeepSeek · Qwen · Mistral · Z.AI     │
                    │  MiniMax · Moonshot · NVIDIA · Meta    │
                    └────────────────────────────────────────┘
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUTER_AUTH_TOKEN` | *required* | Your Puter token from puter.com/dashboard |
| `PORT` | `3800` | Server port |
| `API_KEY` | `sk-puter-proxy` | Auth key for your proxy (set to `"none"` to disable) |
| `DASHBOARD` | `true` | Enable/disable dashboard |

### Routing Strategies

| Strategy | Description |
|----------|-------------|
| 💚 `free_first` | Free → Cheap → Mid → Premium (default, saves allowance) |
| ⚖️ `balanced` | Spread load across free + cheap tiers |
| ⭐ `quality` | Premium → Mid → Cheap → Free (best quality, uses allowance) |
| 🧠 `smart` | Auto-detect complexity, route accordingly |

Change strategy via dashboard or API:

```bash
curl -X POST http://localhost:3800/api/config \
  -H "Content-Type: application/json" \
  -d '{"strategy": "free_first"}'
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | Chat completions (streaming + non-streaming) |
| `/v1/models` | GET | List all available models |
| `/health` | GET | Health check + uptime |
| `/dashboard` | GET | Admin dashboard UI |
| `/api/stats` | GET | Analytics summary |
| `/api/models` | GET | Per-model performance stats |
| `/api/timeline` | GET | Hourly request volume |
| `/api/requests` | GET | Recent request log |
| `/api/health` | GET | Model health/cooldown status |
| `/api/config` | GET/POST | View/update routing config |
| `/api/cooldowns/clear` | POST | Reset all model cooldowns |

---

## 🛡️ How Fallback Works

1. 📥 Request comes in (model: "auto" or specific)
2. 🆓 Router tries **free** models first (NVIDIA Nemotron, Gemma, Poolside...)
3. ❌ If free model fails → instantly tries next model
4. 💰 Escalates through cheap → mid → premium tiers
5. 🔄 Up to **20 models** tried per request, **30s** time budget
6. ❄️ Models that fail 3x get **60s cooldown** (auto-skipped)
7. 📌 **Sticky sessions** keep multi-turn chats on same model (30min)
8. ✅ Response returned — your app never sees a failure

---

## 🆓 Free Models (Zero Cost)

These are tried first by default — your Puter allowance stays untouched:

| Model | Size | Provider |
|-------|------|----------|
| NVIDIA Nemotron Ultra | 550B | OpenRouter (free) |
| NVIDIA Nemotron Super | 120B | OpenRouter (free) |
| NVIDIA Nemotron Nano | 30B | OpenRouter (free) |
| Google Gemma 4 | 31B | OpenRouter (free) |
| Poolside Laguna M.1 | 225B | OpenRouter (free) |
| Poolside Laguna S 2.1 | 118B | OpenRouter (free) |
| OpenAI GPT-OSS | 20B | OpenRouter (free) |
| InclusionAI Ling 3.0 Flash | 124B | OpenRouter (free) |
| Cohere North Mini Code | 30B | OpenRouter (free) |

---

## 📁 Project Structure

```
puter-api-proxy/
├── server/
│   ├── index.mjs        # HTTP server + API routes + dashboard serving
│   ├── router.mjs       # Smart routing with fallback logic
│   ├── models.mjs       # 146 models in 4 cost tiers
│   └── analytics.mjs    # In-memory request tracking
├── dashboard/
│   └── src/
│       ├── App.jsx      # Main app with sidebar navigation
│       ├── styles.css   # Dark theme CSS
│       └── pages/       # Overview, Models, Playground, Analytics, Settings
├── Dockerfile           # Multi-stage Alpine build
├── docker-compose.yml   # One-command deployment
├── .env.example         # Configuration template
└── package.json
```

---

## 📝 License

MIT

---

## 🙏 Credits

- **[Puter.js](https://puter.com)** — Free AI gateway to 500+ models
- **[OpenRouter](https://openrouter.ai)** — Free tier models
