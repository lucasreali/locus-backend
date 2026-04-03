import fastifyMultipart from "@fastify/multipart";
import fp from "fastify-plugin";
import type { FastifyTypeInstance } from "@/types";

export const multipartFp = fp(async (app: FastifyTypeInstance) => {
	await app.register(fastifyMultipart, {
        limits: {
            fileSize: 20 * 1024 * 1024 // 20 MB limit
        }
    });
});
