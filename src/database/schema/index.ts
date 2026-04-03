import { accounts } from "./auth/accounts";
import { emailVerificationTokens } from "./auth/email-verification-tokens";
import { users } from "./auth/users";
import { subjects } from "./subject/subjects";

export const schema = {
	users,
	accounts,
	emailVerificationTokens,
	subjects,
};
