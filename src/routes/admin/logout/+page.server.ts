import type { Actions } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from '$lib/server/auth/admin.js';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete(SESSION_COOKIE_NAME, getSessionCookieOptions(0));
		throw redirect(303, '/admin/login');
	}
};
