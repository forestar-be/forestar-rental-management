import { RootState } from '../index';

/**
 * Get the list of known emails
 */
export const getKnownEmails = (state: RootState) => state.emails.knownEmails;

/**
 * Get the loading state for emails
 */
export const getEmailsLoading = (state: RootState) => state.emails.loading;

/**
 * Get any error that occurred while fetching emails
 */
export const getEmailsError = (state: RootState) => state.emails.error;