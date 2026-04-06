import { accounts } from './auth/accounts';
import { emailVerificationTokens } from './auth/email-verification-tokens';
import { users } from './auth/users';
import { events } from './events';
import { notes } from './notes';
import { subjects } from './subject/subjects';
import { syllabusUploads } from './syllabus-uploads';

export const schema = {
	users,
	accounts,
	emailVerificationTokens,
	subjects,
	syllabusUploads,
	events,
	notes,
};
