import { RATE_LIMITS } from '@/plugins/rate-limit';
import { noContentResponse } from '@/shared/dtos';
import { BadRequestError } from '@/shared/errors/BadRequestError';
import { authHandler } from '@/shared/middlewares/auth-handler';
import type { FastifyTypeInstance } from '@/types';
import '@fastify/multipart';
import {
	listSyllabusResponse,
	type listSyllabusResponseStatic,
	syllabusParams,
	syllabusResponse,
	type syllabusResponseStatic,
	uploadResponse,
} from './syllabus.dto';
import { syllabusService } from './syllabus.service';

export const syllabusController = (app: FastifyTypeInstance) => {
	app.post(
		'/upload',
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				tags: ['syllabus'],
				description: 'Upload PDF for AI processing',
				response: {
					202: uploadResponse,
				},
			},
		},
		async (req, rep) => {
			const { id: userId } = req.user;

			const data = await req.file();
			if (!data) {
				throw new BadRequestError('No file uploaded');
			}
			if (data.mimetype !== 'application/pdf') {
				throw new BadRequestError('Only PDF files are supported');
			}

			const record = await syllabusService.upload({
				userId,
				stream: data.file,
				fileName: data.filename,
				mimeType: data.mimetype,
			});

			return rep.status(202).send({
				id: record.id,
				message: 'File is being processed',
			});
		},
	);

	app.get(
		'/:syllabusId',
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: syllabusParams,
				tags: ['syllabus'],
				description: 'Get syllabus processing state and status by ID',
				response: {
					200: syllabusResponse,
				},
			},
		},
		async (req, rep) => {
			const { syllabusId } = req.params;
			const { id: userId } = req.user;
			const record = await syllabusService.findById(userId, syllabusId);
			return rep.status(200).send(record as syllabusResponseStatic);
		},
	);

	app.get(
		'',
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.READ,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				tags: ['syllabus'],
				description: 'List all syllabus uploads for a user',
				response: {
					200: listSyllabusResponse,
				},
			},
		},
		async (req, rep) => {
			const { id } = req.user;
			const records = await syllabusService.findAllByUserId(id);
			return rep.status(200).send(records as listSyllabusResponseStatic);
		},
	);

	app.delete(
		'/:syllabusId',
		{
			preHandler: authHandler,
			config: {
				rateLimit: RATE_LIMITS.WRITE,
			},
			schema: {
				security: [{ CookieAuth: [] }],
				params: syllabusParams,
				tags: ['syllabus'],
				description: 'Delete syllabus upload',
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
