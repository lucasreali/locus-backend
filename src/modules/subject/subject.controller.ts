import { RATE_LIMITS } from "@/plugins/rate-limit";
import { noContentResponse } from "@/shared/dtos";
import { authHandler } from "@/shared/middlewares/auth-handler";
import type { FastifyTypeInstance } from "@/types";
import {
	listSubjectResponse,
	subjectParams,
	subjectRequest,
	subjectResponse,
	subjectUpdateRequest,
} from "./subject.dto";
import { subjectService } from "./subject.service";

export const subjectController = (app: FastifyTypeInstance) => {
	app.post(
		"",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ["subjects"],
				description: "Create subject",
				body: subjectRequest,
				response: {
					201: subjectResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const data = req.body;
			const subject = await subjectService.create(id, data);
			return rep.status(201).send(subject);
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
				tags: ["subjects"],
				description: "List all subjects from authenticated user",
				response: {
					200: listSubjectResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const subjects = await subjectService.findAll(id);
			return rep.status(200).send(subjects);
		},
	);

	app.get(
		"/:subjectId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ["subjects"],
				description: "Get subject by ID",
				params: subjectParams,
				response: {
					200: subjectResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { subjectId } = req.params;
			const subject = await subjectService.findById(id, subjectId);
			return rep.status(200).send(subject);
		},
	);

	app.put(
		"/:subjectId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ["subjects"],
				description: "Update subject by ID",
				params: subjectParams,
				body: subjectUpdateRequest,
				response: {
					200: subjectResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { subjectId } = req.params;
			const data = req.body;
			const subject = await subjectService.updateById(id, subjectId, data);
			return rep.status(200).send(subject);
		},
	);

	app.delete(
		"/:subjectId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ["subjects"],
				description: "Delete subject by ID",
				params: subjectParams,
				response: {
					204: noContentResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { subjectId } = req.params;
			await subjectService.deleteById(id, subjectId);
			return rep.status(204).send(null);
		},
	);
};
