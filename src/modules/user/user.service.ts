import { hash } from "bcrypt";
import { v7 } from "uuid";
import { ConflictError } from "@/shared/errors/ConflictError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { accountRepository } from "../auth/account.repository";
import { authService } from "../auth/core/auth.service";
import { emailVerificationService } from "../auth/email-verification/email-verification.service";
import type { userRequestStatic, userUpdateRequestStatic } from "./user.dto";
import { userRepository } from "./user.repository";

export const userService = {
	async create(user: userRequestStatic) {
		const [exists] = await userRepository.findByEmail(user.email);

		if (exists) throw new ConflictError("Email already in use");

		const newUser = {
			id: v7(),
			name: user.name,
			email: user.email,
			avatarUrl: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await userRepository.create(newUser);

		await accountRepository.create({
			userId: newUser.id,
			password: await hash(user.password, 10),
		});

		await emailVerificationService.sendVerificationEmail(
			newUser.id,
			newUser.email,
		);

		return newUser;
	},

	async findById(userId: string) {
		const [user] = await userRepository.findById(userId);
		if (!user) throw new NotFoundError("User not found");
		return user;
	},

	async findAll() {
		return await userRepository.findAll();
	},

	async updateById(userId: string, data: userUpdateRequestStatic) {
		const [user] = await userRepository.findById(userId);
		if (!user) throw new NotFoundError("User not found");

		if (data.email && data.email !== user.email) {
			const [existingUser] = await userRepository.findByEmail(data.email);
			if (existingUser) throw new ConflictError("Email already in use");
		}

		const updatedUser = { ...data, updatedAt: new Date() };
		await userRepository.updateById(userId, updatedUser);

		return {
			id: user.id,
			name: data.name ?? user.name,
			email: data.email ?? user.email,
			avatarUrl: data.avatarUrl ?? user.avatarUrl,
			createdAt: user.createdAt,
			updatedAt: new Date(),
		};
	},

	async deleteById(userId: string) {
		await authService.removeAllUserSessions(userId);
		await userRepository.deleteById(userId);
	},
};
