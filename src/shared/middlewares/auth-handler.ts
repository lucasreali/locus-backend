import type { FastifyReply, FastifyRequest } from "fastify";
import { redis } from "@/database/redis";
import { UnauthorizedError } from "../errors/UnauthorizedError";

interface SessionData {
	userId: string;
	createdAt: string;
	expiresAt: string;
}

export const authHandler = async (req: FastifyRequest, _rep: FastifyReply) => {
	const sessionId = req.cookies.sessionToken;

	if (!sessionId) {
		throw new UnauthorizedError("Missing authentication cookie");
	}

	const sessionData = await redis.get(`session:${sessionId}`);

	if (!sessionData) {
		throw new UnauthorizedError("Invalid or expired session");
	}

	let session: SessionData;
	try {
		session = JSON.parse(sessionData);
	} catch {
		throw new UnauthorizedError("Invalid session data");
	}

	const now = new Date();
	const expiresAt = new Date(session.expiresAt);

	if (now > expiresAt) {
		await redis.del(`session:${sessionId}`);
		await redis.srem(`user:sessions:${session.userId}`, sessionId);
		throw new UnauthorizedError("Session expired");
	}

	req.user = { id: session.userId };
};
