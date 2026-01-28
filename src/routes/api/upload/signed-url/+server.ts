import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';
import { verifyAdminSession, SESSION_COOKIE_NAME } from '$lib/server/auth/admin.js';
import { v4 as uuidv4 } from 'uuid';

const getSessionSecret = () => env.SESSION_SECRET || 'dev-secret-change-in-production';

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Verify admin session
	const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
	const { isValid } = verifyAdminSession(sessionCookie, getSessionSecret());

	if (!isValid) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { contentType } = await request.json();

		const supabaseUrl = env.SUPABASE_URL;
		const supabaseKey = env.SUPABASE_SERVICE_KEY;

		if (!supabaseUrl || !supabaseKey) {
			return json({ error: 'Storage not configured' }, { status: 500 });
		}

		const { createClient } = await import('@supabase/supabase-js');
		const supabase = createClient(supabaseUrl, supabaseKey);

		const fileId = uuidv4();

		// Create signed URLs for large + thumbnail only (faster uploads)
		const paths = {
			large: `large/${fileId}.webp`,
			thumbnail: `thumbnails/${fileId}.webp`
		};

		const signedUrls: Record<string, string> = {};
		const publicUrls: Record<string, string> = {};

		for (const [key, path] of Object.entries(paths)) {
			const { data, error } = await supabase.storage
				.from('uploads')
				.createSignedUploadUrl(path);

			if (error) {
				return json({ error: `Failed to create signed URL: ${error.message}` }, { status: 500 });
			}

			signedUrls[key] = data.signedUrl;

			const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
			publicUrls[key] = urlData.publicUrl;
		}

		return json({
			fileId,
			signedUrls,
			publicUrls
		});
	} catch (error) {
		console.error('Error creating signed URL:', error);
		return json({ error: 'Failed to create upload URL' }, { status: 500 });
	}
};
