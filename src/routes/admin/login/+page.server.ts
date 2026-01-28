import type { Actions, PageServerLoad } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	verifyAdminPassword,
	createAdminSessionCookie,
	getSessionCookieOptions,
	SESSION_COOKIE_NAME,
	verifyAdminSession
} from '$lib/server/auth/admin.js';

const getSessionSecret = () => env.SESSION_SECRET || 'dev-secret-change-in-production';

export const load: PageServerLoad = async ({ cookies }) => {
	// Redirect to dashboard if already logged in
	const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
	const { isValid } = verifyAdminSession(sessionCookie, getSessionSecret());

	if (isValid) {
		throw redirect(303, '/admin');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const password = formData.get('password')?.toString();

		if (!password) {
			return fail(400, { error: 'Passwort erforderlich' });
		}

		const isValid = await verifyAdminPassword(password);

		if (!isValid) {
			return fail(401, { error: 'Falsches Passwort' });
		}

		// Create session cookie
		const sessionCookie = createAdminSessionCookie(getSessionSecret());
		cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions());

		throw redirect(303, '/admin');
	}
};
