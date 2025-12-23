import { db } from "@/storage/db";
import { redis } from "@/storage/redis";

/**
 * Generates a comprehensive health dashboard with status of all services.
 *
 * Checks:
 * - Database connectivity and response time
 * - Redis connectivity and response time
 * - Record counts for main tables
 * - Server uptime and version
 *
 * Returns overall status:
 * - 'healthy': All services operational
 * - 'degraded': Some services have issues but core functionality works
 * - 'unhealthy': Critical services are down
 */

interface ServiceStatus {
    status: 'ok' | 'error';
    responseTimeMs: number;
    error?: string;
}

interface DatabaseStatus extends ServiceStatus {
    recordCounts?: {
        accounts: number;
        sessions: number;
        messages: number;
        machines: number;
    };
}

interface RedisStatus extends ServiceStatus {
    connectedClients?: number;
    usedMemory?: string;
}

interface HealthDashboardResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptimeSeconds: number;
    services: {
        database: DatabaseStatus;
        redis: RedisStatus;
    };
}

const serverStartTime = Date.now();

export async function healthDashboard(): Promise<HealthDashboardResult> {
    const [databaseStatus, redisStatus] = await Promise.all([
        checkDatabase(),
        checkRedis()
    ]);

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (databaseStatus.status === 'error') {
        status = 'unhealthy'; // Database is critical
    } else if (redisStatus.status === 'error') {
        status = 'degraded'; // Redis issues mean degraded but functional
    } else {
        status = 'healthy';
    }

    return {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.0.0',
        uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
        services: {
            database: databaseStatus,
            redis: redisStatus
        }
    };
}

async function checkDatabase(): Promise<DatabaseStatus> {
    const start = Date.now();
    try {
        // Test connectivity
        await db.$queryRaw`SELECT 1`;
        const responseTimeMs = Date.now() - start;

        // Get record counts
        const [accounts, sessions, messages, machines] = await Promise.all([
            db.account.count(),
            db.session.count(),
            db.sessionMessage.count(),
            db.machine.count()
        ]);

        return {
            status: 'ok',
            responseTimeMs,
            recordCounts: {
                accounts,
                sessions,
                messages,
                machines
            }
        };
    } catch (error) {
        return {
            status: 'error',
            responseTimeMs: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function checkRedis(): Promise<RedisStatus> {
    const start = Date.now();
    try {
        // Test connectivity with PING
        await redis.ping();
        const responseTimeMs = Date.now() - start;

        // Get basic info
        const info = await redis.info('clients');
        const memoryInfo = await redis.info('memory');

        const connectedClientsMatch = info.match(/connected_clients:(\d+)/);
        const usedMemoryMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);

        return {
            status: 'ok',
            responseTimeMs,
            connectedClients: connectedClientsMatch ? parseInt(connectedClientsMatch[1]) : undefined,
            usedMemory: usedMemoryMatch ? usedMemoryMatch[1] : undefined
        };
    } catch (error) {
        return {
            status: 'error',
            responseTimeMs: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
