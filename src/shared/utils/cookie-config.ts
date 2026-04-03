import type { CookieSerializeOptions } from "@fastify/cookie";

export const getCookieConfig = (maxAge?: number): CookieSerializeOptions => {
	const isProduction = process.env.NODE_ENV === "production";

	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? "none" : "lax",
		maxAge: maxAge || 7 * 24 * 60 * 60,
		path: "/",
	};
};
