import type { FastifyReply, FastifyRequest } from "fastify";
import { redis } from "@/database/redis";
import { UnauthorizedError } from "../errors/UnauthorizedError";

interface SessionData {
	userId: string;
	createdAt: string;
	expiresAt: string;
}

interface UserCacheData {
	id: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	createdAt: string;
	updatedAt: string;
}

export const authHandler = async (req: FastifyRequest, _rep: FastifyReply) => {
	const sessionId = req.headers.authorization?.replace("Bearer ", "");

	if (!sessionId) {
		throw new UnauthorizedError("Missing authorization token");
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

	const userCacheRaw = await redis.get(`user:cache:${session.userId}`);

	if (!userCacheRaw) {
		throw new UnauthorizedError("User session data not found");
	}

	let userData: UserCacheData;
	try {
		userData = JSON.parse(userCacheRaw);
	} catch {
		throw new UnauthorizedError("Invalid user session data");
	}

	req.user = {
		id: userData.id,
		name: userData.name,
		email: userData.email,
		avatarUrl: userData.avatarUrl,
		createdAt: userData.createdAt,
		updatedAt: userData.updatedAt,
	};
};
