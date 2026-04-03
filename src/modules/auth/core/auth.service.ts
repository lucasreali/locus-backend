import { redis } from '@/database/redis';
import { UnauthorizedError } from '@/shared/errors/UnauthorizedError';
import { compare } from 'bcrypt';
import { v7 } from 'uuid';
import { accountRepository } from '../account.repository';
import type { authLoginRequestStatic } from './auth.dto';

export const authService = {
    SESSION_EXPIRY: 7 * 24 * 60 * 60,

    async _createUserSession(userId: string) {
        await this.removeAllUserSessions(userId);

        const sessionId = v7();
        const sessionData = {
            userId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(
                Date.now() + this.SESSION_EXPIRY * 1000,
            ).toISOString(),
        };

        await redis.set(
            `session:${sessionId}`,
            JSON.stringify(sessionData),
            'EX',
            this.SESSION_EXPIRY,
        );

        await redis.sadd(`user:sessions:${userId}`, sessionId);

        return sessionId;
    },

    async _validateSession(sessionId: string) {
        const sessionData = await redis.get(`session:${sessionId}`);

        if (!sessionData) {
            return null;
        }

        try {
            return JSON.parse(sessionData);
        } catch {
            return null;
        }
    },

    async removeAllUserSessions(userId: string) {
        const userSessions = await redis.smembers(`user:sessions:${userId}`);

        if (userSessions.length > 0) {
            const pipeline = redis.pipeline();

            userSessions.forEach((sessionId) => {
                pipeline.del(`session:${sessionId}`);
            });

            pipeline.del(`user:sessions:${userId}`);

            await pipeline.exec();
        }
    },

    async login(credentials: authLoginRequestStatic) {
        const [info] = await accountRepository.findByInfoLoginByUserEmail(
            credentials.email,
        );

        if (!info) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (!info.accounts.emailVerified) {
            throw new UnauthorizedError('Please, verify your email first');
        }

        const isMatch = await compare(
            credentials.password,
            info.accounts.password,
        );

        if (!isMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }
        const sessionId = await this._createUserSession(info.users.id);

        return { sessionId, user: info.users };
    },

    async logout(sessionId: string) {
        const sessionData = await this._validateSession(sessionId);

        if (sessionData) {
            await redis.del(`session:${sessionId}`);
            await redis.srem(`user:sessions:${sessionData.userId}`, sessionId);
        }
    },
};
