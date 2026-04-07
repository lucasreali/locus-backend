import { RATE_LIMITS } from "@/plugins/rate-limit";
import { messageResponse, noContentResponse } from "@/shared/dtos";
import { authHandler } from "@/shared/middlewares/auth-handler";
import type { FastifyTypeInstance } from "@/types";
import {
	listUserResponse,
	userParams,
	userRequest,
	userResponse,
	userUpdateRequest,
} from "./user.dto";
import { userService } from "./user.service";

export const userController = (app: FastifyTypeInstance) => {
	app.post(
		"",
		{
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				tags: ["users"],
				description: "Create",
				body: userRequest,
				response: {
					201: messageResponse,
				},
			},
		},
		async (req, rep) => {
			const user = req.body;
			await userService.create(user);
			return rep.status(201).send({
				message:
					"User created successfully! Check your email to activate your account.",
			});
		},
	);

	app.get(
		"/:userId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				params: userParams,
				tags: ["users"],
				description: "Get user by ID",
				response: {
					200: userResponse,
				},
			},
		},
		async (req, rep) => {
			const { userId } = req.params;
			const user = await userService.findById(userId);
			return rep.status(200).send(user);
		},
	);

	app.get(
		"",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ["users"],
				description: "List all users",
				response: {
					200: listUserResponse,
				},
			},
		},
		async (_req, rep) => {
			const users = await userService.findAll();
			return rep.status(200).send(users);
		},
	);

	app.put(
		"",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				body: userUpdateRequest,
				tags: ["users"],
				description: "Update user",
				response: {
					200: userResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const updateData = req.body;
			const updatedUser = await userService.updateById(id, updateData);
			return rep.status(200).send(updatedUser);
		},
	);

	app.delete(
		"",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ["users"],
				description: "Delete user",
				response: {
					204: noContentResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			await userService.deleteById(id);
			return rep.status(204).send(null);
		},
	);
};
