import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	verifyAdminSession,
	SESSION_COOKIE_NAME
} from '$lib/server/auth/admin.js';
import { validateJuryToken } from '$lib/server/auth/jury.js';

const getSessionSecret = () => env.SESSION_SECRET || 'dev-secret-change-in-production';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Admin routes protection
	if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
		const sessionCookie = event.cookies.get(SESSION_COOKIE_NAME);
		const { isValid } = verifyAdminSession(sessionCookie, getSessionSecret());

		if (!isValid) {
			throw redirect(303, '/admin/login');
		}

		event.locals.admin = { isAuthenticated: true };
	}

	// Jury routes protection
	if (pathname.startsWith('/jury/')) {
		const token = pathname.split('/jury/')[1]?.split('/')[0];

		if (token) {
			const validation = await validateJuryToken(token);

			if (!validation.isValid || !validation.juryMember) {
				// Return a 404 page for invalid tokens to not reveal token validation
				return new Response('Not Found', { status: 404 });
			}

			event.locals.jury = {
				id: validation.juryMember.id,
				name: validation.juryMember.name,
				juryType: validation.juryMember.juryType,
				allowedCategoryIds: validation.allowedCategoryIds ?? null
			};
		}
	}

	return resolve(event);
};
