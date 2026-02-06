import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

interface RouteMetric {
  count: number;
  totalMs: number;
  maxMs: number;
}

export class ApiMetricsStore {
  private readonly routeMetrics = new Map<string, RouteMetric>();
  private requestCount = 0;

  record(routeKey: string, durationMs: number): void {
    this.requestCount += 1;
    const current = this.routeMetrics.get(routeKey) ?? { count: 0, totalMs: 0, maxMs: 0 };
    current.count += 1;
    current.totalMs += durationMs;
    current.maxMs = Math.max(current.maxMs, durationMs);
    this.routeMetrics.set(routeKey, current);
  }

  snapshot(): {
    total_requests: number;
    routes: Record<string, { count: number; avg_ms: number; max_ms: number }>;
  } {
    const routes: Record<string, { count: number; avg_ms: number; max_ms: number }> = {};
    this.routeMetrics.forEach((metric, routeKey) => {
      routes[routeKey] = {
        count: metric.count,
        avg_ms: Number((metric.totalMs / metric.count).toFixed(2)),
        max_ms: Number(metric.maxMs.toFixed(2)),
      };
    });
    return {
      total_requests: this.requestCount,
      routes,
    };
  }
}

export function registerObservabilityHooks(app: FastifyInstance, metrics: ApiMetricsStore): void {
  app.addHook('onRequest', (request, _reply, done) => {
    request.headers['x-start-ms'] = String(Date.now());
    done();
  });

  app.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done) => {
    const started = Number(request.headers['x-start-ms'] ?? Date.now());
    const elapsed = Math.max(0, Date.now() - started);
    const routePath = request.routeOptions?.url ?? request.url.split('?')[0];
    const routeKey = `${request.method} ${routePath}`;
    metrics.record(routeKey, elapsed);
    app.log.info({ route: routeKey, status: reply.statusCode, elapsed_ms: elapsed }, 'request complete');
    done();
  });
}

