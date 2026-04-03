import { accounts } from "./auth/accounts";
import { emailVerificationTokens } from "./auth/email-verification-tokens";
import { users } from "./auth/users";
import { subjects } from "./subject/subjects";
import { syllabi } from "./syllabi";
import { calendarEvents } from "./calendar-events";

export const schema = {
	users,
	accounts,
	emailVerificationTokens,
	subjects,
	syllabi,
	calendarEvents,
};
