import type { FastifyReply, FastifyRequest } from "fastify";
import { authorizationService } from "@/shared/services/authorization.service";
import type { Permission } from "@/shared/types/rbac.types";

interface AuthorizedRequest extends FastifyRequest {
	user: { id: string };
}

export const requirePermission = (permission: Permission) => {
	return async (req: AuthorizedRequest, _rep: FastifyReply) => {
		const userId = req.user.id;

		let projectId = (req.params as any).projectId;

		if (!projectId) {
			const sprintId = (req.params as any).sprintId;
			const cardId = (req.params as any).cardId;
			const columnId = (req.params as any).columnId;
			const documentId = (req.params as any).documentId;
			const tagId = (req.params as any).tagId;

			if (sprintId) {
				projectId = await authorizationService.getProjectIdFromSprint(sprintId);
			} else if (cardId) {
				projectId = await authorizationService.getProjectIdFromCard(cardId);
			} else if (columnId) {
				projectId = await authorizationService.getProjectIdFromColumn(columnId);
			} else if (documentId) {
				projectId =
					await authorizationService.getProjectIdFromDocument(documentId);
			} else if (tagId) {
				projectId = await authorizationService.getProjectIdFromTag(tagId);
			}
		}

		if (!projectId) {
			const bodyProjectId = (req.body as any)?.projectId;
			if (bodyProjectId) {
				projectId = bodyProjectId;
			}
		}

		if (projectId) {
			await authorizationService.checkPermission(userId, projectId, permission);
		}
	};
};
