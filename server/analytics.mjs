// In-memory analytics with rolling window retention

const MAX_REQUESTS = 10000;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class Analytics {
  constructor() {
    this.requests = [];
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.totalSuccess = 0;
    this.totalFailures = 0;
  }

  logRequest(data) {
    const entry = {
      ...data,
      timestamp: Date.now(),
    };
    this.requests.push(entry);
    this.totalRequests++;
    if (data.success) this.totalSuccess++;
    else this.totalFailures++;

    // Prune old entries
    this.prune();
  }

  prune() {
    const cutoff = Date.now() - RETENTION_MS;
    while (this.requests.length > MAX_REQUESTS || (this.requests.length > 0 && this.requests[0].timestamp < cutoff)) {
      this.requests.shift();
    }
  }

  // Get summary stats
  getSummary() {
    const now = Date.now();
    const last24h = this.requests.filter((r) => now - r.timestamp < 24 * 60 * 60 * 1000);
    const last1h = this.requests.filter((r) => now - r.timestamp < 60 * 60 * 1000);

    return {
      uptime: Math.floor((now - this.startTime) / 1000),
      total: {
        requests: this.totalRequests,
        success: this.totalSuccess,
        failures: this.totalFailures,
        successRate: this.totalRequests > 0 ? ((this.totalSuccess / this.totalRequests) * 100).toFixed(1) : "0",
      },
      last24h: this.computeWindow(last24h),
      last1h: this.computeWindow(last1h),
    };
  }

  computeWindow(entries) {
    if (entries.length === 0) {
      return { requests: 0, success: 0, failures: 0, successRate: "0", avgLatency: 0, p95Latency: 0 };
    }

    const success = entries.filter((e) => e.success);
    const latencies = success.map((e) => e.latencyMs).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;

    return {
      requests: entries.length,
      success: success.length,
      failures: entries.length - success.length,
      successRate: ((success.length / entries.length) * 100).toFixed(1),
      avgLatency,
      p95Latency,
    };
  }

  // Per-model breakdown
  getModelStats() {
    const now = Date.now();
    const recent = this.requests.filter((r) => now - r.timestamp < 24 * 60 * 60 * 1000);
    const byModel = {};

    for (const entry of recent) {
      if (!byModel[entry.model]) {
        byModel[entry.model] = { requests: 0, success: 0, failures: 0, totalLatency: 0 };
      }
      const m = byModel[entry.model];
      m.requests++;
      if (entry.success) {
        m.success++;
        m.totalLatency += entry.latencyMs || 0;
      } else {
        m.failures++;
      }
    }

    return Object.entries(byModel).map(([model, stats]) => ({
      model,
      ...stats,
      avgLatency: stats.success > 0 ? Math.round(stats.totalLatency / stats.success) : 0,
      successRate: stats.requests > 0 ? ((stats.success / stats.requests) * 100).toFixed(1) : "0",
    })).sort((a, b) => b.requests - a.requests);
  }

  // Recent requests log
  getRecentRequests(limit = 50) {
    return this.requests.slice(-limit).reverse().map((r) => ({
      ...r,
      time: new Date(r.timestamp).toISOString(),
    }));
  }

  // Requests over time (hourly buckets for last 24h)
  getTimeline() {
    const now = Date.now();
    const buckets = [];
    for (let i = 23; i >= 0; i--) {
      const bucketStart = now - (i + 1) * 60 * 60 * 1000;
      const bucketEnd = now - i * 60 * 60 * 1000;
      const inBucket = this.requests.filter((r) => r.timestamp >= bucketStart && r.timestamp < bucketEnd);
      buckets.push({
        hour: new Date(bucketStart).toISOString().slice(11, 16),
        requests: inBucket.length,
        success: inBucket.filter((r) => r.success).length,
        failures: inBucket.filter((r) => !r.success).length,
      });
    }
    return buckets;
  }
}

export default Analytics;
