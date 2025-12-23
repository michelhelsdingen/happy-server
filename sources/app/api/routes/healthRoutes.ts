import { z } from "zod";
import { type Fastify } from "../types";
import { healthDashboard } from "../health/healthDashboard";

const ServiceStatusSchema = z.object({
    status: z.enum(['ok', 'error']),
    responseTimeMs: z.number(),
    error: z.string().optional()
});

const DatabaseStatusSchema = ServiceStatusSchema.extend({
    recordCounts: z.object({
        accounts: z.number(),
        sessions: z.number(),
        messages: z.number(),
        machines: z.number()
    }).optional()
});

const RedisStatusSchema = ServiceStatusSchema.extend({
    connectedClients: z.number().optional(),
    usedMemory: z.string().optional()
});

const HealthDashboardResponseSchema = z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: z.string(),
    version: z.string(),
    uptimeSeconds: z.number(),
    services: z.object({
        database: DatabaseStatusSchema,
        redis: RedisStatusSchema
    })
});

export function healthRoutes(app: Fastify) {
    app.get('/v1/health/dashboard', {
        schema: {
            response: {
                200: HealthDashboardResponseSchema
            }
        }
    }, async (request, reply) => {
        const result = await healthDashboard();

        // Return 503 if unhealthy
        if (result.status === 'unhealthy') {
            reply.code(503);
        }

        return result;
    });
}
