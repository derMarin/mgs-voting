import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';
import { processAndSaveImage } from '$lib/server/services/image.service.js';
import { addCandidateImage, getCandidateById } from '$lib/server/services/candidate.service.js';
import { verifyAdminSession, SESSION_COOKIE_NAME } from '$lib/server/auth/admin.js';

const getSessionSecret = () => env.SESSION_SECRET || 'dev-secret-change-in-production';

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Verify admin session
	const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
	const { isValid } = verifyAdminSession(sessionCookie, getSessionSecret());

	if (!isValid) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('image') as File | null;
		const candidateId = formData.get('candidateId')?.toString();

		if (!file || !file.size) {
			return json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
		}

		if (!candidateId) {
			return json({ error: 'Kandidaten-ID erforderlich' }, { status: 400 });
		}

		// Verify candidate exists
		const candidate = await getCandidateById(candidateId);
		if (!candidate) {
			return json({ error: 'Kandidat nicht gefunden' }, { status: 404 });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
		if (!allowedTypes.includes(file.type)) {
			return json(
				{ error: 'Ungültiger Dateityp. Erlaubt: JPEG, PNG, WebP, GIF' },
				{ status: 400 }
			);
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			return json({ error: 'Datei zu groß. Maximum: 10MB' }, { status: 400 });
		}

		// Process and save image
		const imagePaths = await processAndSaveImage(file);

		// Add to database
		const image = await addCandidateImage(candidateId, imagePaths);

		// Redirect back to candidate page
		throw redirect(303, `/admin/candidates/${candidateId}`);
	} catch (err) {
		if ((err as Response)?.status === 303) {
			throw err; // Re-throw redirects
		}

		console.error('Error uploading image:', err);
		return json({ error: 'Fehler beim Hochladen des Bildes' }, { status: 500 });
	}
};
