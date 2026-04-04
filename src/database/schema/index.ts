import { aiUploads } from './ai-uploads';
import { accounts } from './auth/accounts';
import { emailVerificationTokens } from './auth/email-verification-tokens';
import { users } from './auth/users';
import { events } from './events';
import { notes } from './notes';
import { subjects } from './subject/subjects';

export const schema = {
    users,
    accounts,
    emailVerificationTokens,
    subjects,
    aiUploads,
    events,
    notes,
};
