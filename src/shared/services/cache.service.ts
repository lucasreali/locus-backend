import { redis } from "@/database/redis";

export interface CacheOptions {
	ttl?: number;
	prefix?: string;
}

export const cacheService = {
	_buildKey(namespace: string, key: string) {
		return `locus:cache:${namespace}:${key}`;
	},

	async get(namespace: string, key: string) {
		try {
			const cacheKey = this._buildKey(namespace, key);
			const cached = await redis.get(cacheKey);

			if (!cached) {
				return null;
			}

			return JSON.parse(cached);
		} catch (error) {
			console.error(`Cache GET error for ${namespace}:${key}:`, error);
			return null;
		}
	},

	async set(
		namespace: string,
		key: string,
		value: unknown,
		options?: CacheOptions,
	) {
		try {
			const cacheKey = this._buildKey(namespace, key);
			const serialized = JSON.stringify(value);
			const ttl = options?.ttl || 300;

			await redis.set(cacheKey, serialized, "EX", ttl);
		} catch (error) {
			console.error(`Cache SET error for ${namespace}:${key}:`, error);
		}
	},

	async del(namespace: string, key: string) {
		try {
			const cacheKey = this._buildKey(namespace, key);
			await redis.del(cacheKey);
		} catch (error) {
			console.error(`Cache DEL error for ${namespace}:${key}:`, error);
		}
	},

	async invalidatePattern(pattern: string) {
		try {
			let cursor = "0";
			do {
				const [nextCursor, keys] = await redis.scan(
					cursor,
					"MATCH",
					pattern,
					"COUNT",
					100,
				);
				cursor = nextCursor;

				if (keys.length > 0) {
					await redis.del(...keys);
				}
			} while (cursor !== "0");
		} catch (error) {
			console.error(`Cache INVALIDATE PATTERN error for ${pattern}:`, error);
		}
	},

	async invalidateNamespace(namespace: string) {
		const pattern = this._buildKey(namespace, "*");
		await this.invalidatePattern(pattern);
	},

	async getOrSet(
		namespace: string,
		key: string,
		fetcher: () => any,
		options?: CacheOptions,
	) {
		const cached = await this.get(namespace, key);
		if (cached !== null) {
			return cached;
		}

		const value = await fetcher();

		this.set(namespace, key, value, options).catch((err) => {
			console.error("Failed to cache result:", err);
		});

		return value;
	},
};
