import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { getAllCategories } from '$lib/server/services/category.service.js';
import {
	getCandidateWithImages,
	updateCandidate,
	deleteCandidateImage
} from '$lib/server/services/candidate.service.js';
import { db } from '$lib/server/db/index.js';
import { candidates } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const candidate = await getCandidateWithImages(params.id);

	if (!candidate) {
		throw error(404, 'Kandidat nicht gefunden');
	}

	// Get the category for this candidate
	const candidateWithCategory = await db.query.candidates.findFirst({
		where: eq(candidates.id, params.id),
		with: {
			category: true
		}
	});

	const categories = await getAllCategories();

	return {
		candidate: {
			...candidate,
			category: candidateWithCategory?.category
		},
		categories
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const formData = await request.formData();
		const categoryId = formData.get('categoryId')?.toString();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() || '0', 10);

		if (!categoryId) {
			return fail(400, { error: 'Kategorie ist erforderlich' });
		}

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name ist erforderlich' });
		}

		try {
			const updated = await updateCandidate(params.id, {
				categoryId,
				name: name.trim(),
				description: description || null,
				sortOrder
			});

			if (!updated) {
				return fail(404, { error: 'Kandidat nicht gefunden' });
			}

			return { success: true };
		} catch (err) {
			console.error('Error updating candidate:', err);
			return fail(500, { error: 'Fehler beim Aktualisieren des Kandidaten' });
		}
	},

	deleteImage: async ({ request }) => {
		const formData = await request.formData();
		const imageId = formData.get('imageId')?.toString();

		if (!imageId) {
			return fail(400, { error: 'Bild-ID erforderlich' });
		}

		try {
			const deleted = await deleteCandidateImage(imageId);
			if (!deleted) {
				return fail(404, { error: 'Bild nicht gefunden' });
			}

			return { success: true, imageDeleted: true };
		} catch (err) {
			console.error('Error deleting image:', err);
			return fail(500, { error: 'Fehler beim Löschen des Bildes' });
		}
	}
};
