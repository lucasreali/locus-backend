import { RATE_LIMITS } from "@/plugins/rate-limit";
import { noContentResponse } from "@/shared/dtos";
import { authHandler } from "@/shared/middlewares/auth-handler";
import type { FastifyTypeInstance } from "@/types";
import {
	listNoteResponse,
	type listNoteResponseStatic,
	noteParams,
	noteQueryParams,
	noteRequest,
	noteResponse,
	type noteResponseStatic,
	noteUpdateRequest,
} from "./note.dto";
import { noteService } from "./note.service";

export const noteController = (app: FastifyTypeInstance) => {
	app.post(
		"",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				tags: ["notes"],
				description: "Create note",
				body: noteRequest,
				response: {
					201: noteResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const note = req.body;
			const newNote = await noteService.create(id, note);
			return rep.status(201).send(newNote as noteResponseStatic);
		},
	);

	app.get(
		"/:noteId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				params: noteParams,
				tags: ["notes"],
				description: "Get note by ID",
				response: {
					200: noteResponse,
				},
			},
		},
		async (req, rep) => {
			const { noteId } = req.params;
			const { id: userId } = req.user;
			const note = await noteService.findById(userId, noteId);
			return rep.status(200).send(note as noteResponseStatic);
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
				tags: ["notes"],
				description: "List all notes",
				querystring: noteQueryParams,
				response: {
					200: listNoteResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const filters = req.query;
			const notes = await noteService.findAllByUserId(id, filters);
			return rep.status(200).send(notes as listNoteResponseStatic);
		},
	);

	app.put(
		"/:noteId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				params: noteParams,
				body: noteUpdateRequest,
				tags: ["notes"],
				description: "Update note",
				response: {
					200: noteResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { noteId } = req.params;
			const updateData = req.body;
			const updatedNote = await noteService.updateById(id, noteId, updateData);
			return rep.status(200).send(updatedNote as noteResponseStatic);
		},
	);

	app.delete(
		"/:noteId",
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ BearerAuth: [] }],
				params: noteParams,
				tags: ["notes"],
				description: "Delete note",
				response: {
					204: noContentResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const { noteId } = req.params;
			await noteService.deleteById(id, noteId);
			return rep.status(204).send(null);
		},
	);
};
