import { accounts } from "./auth/accounts";
import { emailVerificationTokens } from "./auth/email-verification-tokens";
import { users } from "./auth/users";


export const schema = {
	users,
	accounts,
	emailVerificationTokens,
};
