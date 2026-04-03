import { db } from '@/database/db';
import { schema } from '@/database/schema';
import { cacheService } from '@/shared/services/cache.service';
import { eq } from 'drizzle-orm';
import type {
    createUserSchemaStatic,
    userUpdateRequestStatic,
} from './user.dto';

const USER_CACHE_TTL = 600;

export const userRepository = {
    async create(user: createUserSchemaStatic) {
        await db.insert(schema.users).values(user);
    },

    async findByEmail(email: string) {
        return await cacheService.getOrSet(
            'user:email',
            email,
            async () => {
                return await db
                    .select()
                    .from(schema.users)
                    .where(eq(schema.users.email, email));
            },
            { ttl: USER_CACHE_TTL },
        );
    },

    async findById(id: string) {
        return await cacheService.getOrSet(
            'user',
            id,
            async () => {
                return await db
                    .select()
                    .from(schema.users)
                    .where(eq(schema.users.id, id));
            },
            { ttl: USER_CACHE_TTL },
        );
    },

    async findAll() {
        return await db.select().from(schema.users);
    },

    async updateById(
        id: string,
        data: userUpdateRequestStatic & { updatedAt?: Date },
    ) {
        await db.update(schema.users).set(data).where(eq(schema.users.id, id));

        await cacheService.del('user', id);

        if (data.email) {
            await cacheService.del('user:email', data.email);
        }
    },

    async deleteById(id: string) {
        const [user] = await this.findById(id);

        await db.delete(schema.users).where(eq(schema.users.id, id));

        await cacheService.del('user', id);
        if (user?.email) {
            await cacheService.del('user:email', user.email);
        }
    },
};
