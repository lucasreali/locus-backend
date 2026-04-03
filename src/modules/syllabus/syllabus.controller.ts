import { RATE_LIMITS } from "@/plugins/rate-limit";
import { authHandler } from "@/shared/middlewares/auth-handler";
import type { FastifyTypeInstance } from "@/types";
import { z } from "zod";
import { uploadResponse, syllabusParams, syllabusResponse, listSyllabusResponse } from "./syllabus.dto";
import { syllabusService } from "./syllabus.service";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { BadRequestError } from "@/shared/errors/BadRequestError";
import { ForbiddenError } from "@/shared/errors/ForbiddenError";

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

            if (data.mimetype !== 'application/pdf') {
                 throw new BadRequestError("Only PDF files are supported");
            }

            const tempDir = os.tmpdir();
            // A secure random generated hex attached to make sure file name does not clash
            const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}.pdf`;
            const filePath = path.join(tempDir, uniqueFilename);
            
            // Save local disk temporal pipe
            await pipeline(data.file, require('node:fs').createWriteStream(filePath));
			
			const uploadData = {
                userId,
                fileName: data.filename,
                filePath,
                mimeType: data.mimetype
            };

            const createdFile = await syllabusService.upload(uploadData);

			return rep.status(202).send({ id: createdFile.id, message: "File is being processed" });
		},
	);


	app.get(
		"/:id",
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
			const { id: syllabusId } = req.params;
			const { id: userId } = req.user;
			const syllabus = await syllabusService.findById(syllabusId);
            if(syllabus.userId !== userId) {
                throw new ForbiddenError("Forbidden");
            }
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
			const events = await syllabusService.findAllByUserId(id);
			return rep.status(200).send(events as any);
		},
	);

    app.delete(
		"/:id",
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
					204: z.any(),
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
            const { id: syllabusId } = req.params;
			await syllabusService.deleteById(id, syllabusId);
			return rep.status(204).send(null);
		},
	);
};
