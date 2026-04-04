import "@fastify/multipart";
import { RATE_LIMITS } from "@/plugins/rate-limit";
import { noContentResponse } from "@/shared/dtos";
import { BadRequestError } from "@/shared/errors/BadRequestError";
import { authHandler } from "@/shared/middlewares/auth-handler";
import type { FastifyTypeInstance } from "@/types";
import {
	listSyllabusResponse,
	syllabusParams,
	syllabusResponse,
	uploadResponse,
} from "./ai.dto";
import { syllabusService } from "./ai.service";

export const syllabusController = (app: FastifyTypeInstance) => {
	app.post(
		"/upload",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				tags: ["syllabus"],
				description: "Upload syllabus/assignment PDF for AI processing",
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

			const createdFile = await syllabusService.upload({
				userId,
				stream: data.file,
				fileName: data.filename,
				mimeType: data.mimetype,
			});

			return rep
				.status(202)
				.send({ id: createdFile.id, message: "File is being processed" });
		},
	);

	app.get(
		"/:syllabusId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: syllabusParams,
				tags: ["syllabus"],
				description: "Get syllabus processing state and status by ID",
				response: {
					200: syllabusResponse,
				},
			},
		},
		async (req, rep) => {
			const { syllabusId } = req.params;
			const { id: userId } = req.user;
			const syllabus = await syllabusService.findById(userId, syllabusId);
			return rep.status(200).send(syllabus as any);
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
				tags: ["syllabus"],
				description: "List all syllabi for a user",
				response: {
					200: listSyllabusResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const syllabi = await syllabusService.findAllByUserId(id);
			return rep.status(200).send(syllabi as any);
		},
	);

	app.delete(
		"/:syllabusId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: syllabusParams,
				tags: ["syllabus"],
				description: "Delete syllabus",
				response: {
					204: noContentResponse,
				},
			},
		},
		async (req, rep) => {
			const { id: userId } = req.user;
			const { syllabusId } = req.params;
			await syllabusService.deleteById(userId, syllabusId);
			return rep.status(204).send(null);
		},
	);
};
