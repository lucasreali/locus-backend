import { RATE_LIMITS } from "@/plugins/rate-limit";
import { noContentResponse } from "@/shared/dtos";
import { BadRequestError } from "@/shared/errors/BadRequestError";
import { authHandler } from "@/shared/middlewares/auth-handler";
import type { FastifyTypeInstance } from "@/types";
import "@fastify/multipart";
import {
	aiParams,
	aiResponse,
	type aiResponseStatic,
	listAiResponse,
	type listAiResponseStatic,
	uploadResponse,
} from "./ai.dto";
import { aiService } from "./ai.service";

export const aiController = (app: FastifyTypeInstance) => {
	app.post(
		"/upload",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				tags: ["ai"],
				description: "Upload PDF for AI processing",
				response: {
					202: uploadResponse,
				},
			},
		},
		async (req, rep) => {
			const { id: userId } = req.user;

			const data = await req.file();
			if (!data) {
				throw new BadRequestError("No file uploaded");
			}
			if (data.mimetype !== "application/pdf") {
				throw new BadRequestError("Only PDF files are supported");
			}

			const createdFile = await aiService.upload({
				userId,
				stream: data.file,
				fileName: data.filename,
				mimeType: data.mimetype,
			});

			return rep.status(202).send({
				id: createdFile.id,
				message: "File is being processed",
			});
		},
	);

	app.get(
		"/:aiId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: aiParams,
				tags: ["ai"],
				description: "Get AI processing state and status by ID",
				response: {
					200: aiResponse,
				},
			},
		},
		async (req, rep) => {
			const { aiId } = req.params;
			const { id: userId } = req.user;
			const aiRecord = await aiService.findById(userId, aiId);
			return rep.status(200).send(aiRecord as aiResponseStatic);
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
				security: [{ CookieAuth: [] }],
				tags: ["ai"],
				description: "List all AI uploads for a user",
				response: {
					200: listAiResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const aiRecords = await aiService.findAllByUserId(id);
			return rep.status(200).send(aiRecords as listAiResponseStatic);
		},
	);

	app.delete(
		"/:aiId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: aiParams,
				tags: ["ai"],
				description: "Delete AI upload",
				response: {
					204: noContentResponse,
				},
			},
		},
		async (req, rep) => {
			const { id: userId } = req.user;
			const { aiId } = req.params;
			await aiService.deleteById(userId, aiId);
			return rep.status(204).send(null);
		},
	);
};
