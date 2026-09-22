import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Enterprise Production Health Check Endpoint
 * Used by cloud load balancers, container orchestrators (K8s, ECS),
 * and uptime monitoring services (BetterStack, Datadog, Uptime Kuma).
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus: "healthy" | "unhealthy" = "healthy";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const dbPingStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbPingStart;
  } catch (err: unknown) {
    dbStatus = "unhealthy";
    dbLatencyMs = Date.now() - startTime;
    dbError = err instanceof Error ? err.message : "Database connection check failed";
  }

  const isHealthy = dbStatus === "healthy";
  const totalResponseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      responseTimeMs: totalResponseTimeMs,
      services: {
        web: {
          status: "healthy",
        },
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          ...(dbError ? { error: dbError } : {}),
        },
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Surrogate-Control": "no-store",
      },
    }
  );
}

