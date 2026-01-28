import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getAllCategories } from '$lib/server/services/category.service.js';
import {
	getCandidatesByCategory,
	createCandidate,
	deleteCandidate,
	addCandidateImage
} from '$lib/server/services/candidate.service.js';
import { processAndSaveImage } from '$lib/server/services/image.service.js';
import { db } from '$lib/server/db/index.js';
import { candidates, candidateImages } from '$lib/server/db/schema.js';
import { asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const categoryId = url.searchParams.get('category');
	const categories = await getAllCategories();

	let candidateList;
	if (categoryId) {
		candidateList = await getCandidatesByCategory(categoryId);
	} else {
		// Get all candidates with their images
		candidateList = await db.query.candidates.findMany({
			orderBy: [asc(candidates.sortOrder), asc(candidates.name)],
			with: {
				images: {
					orderBy: [asc(candidateImages.sortOrder)]
				},
				category: true
			}
		});
	}

	return {
		categories,
		candidates: candidateList,
		selectedCategoryId: categoryId
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const categoryId = formData.get('categoryId')?.toString();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() || '0', 10);
		const imageFile = formData.get('image') as File | null;

		if (!categoryId) {
			return fail(400, { error: 'Kategorie ist erforderlich' });
		}

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name ist erforderlich' });
		}

		try {
			const candidate = await createCandidate({
				categoryId,
				name: name.trim(),
				description: description?.trim() || null,
				sortOrder
			});

			// Process and save image if provided
			if (imageFile && imageFile.size > 0) {
				// Validate file type
				const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
				if (!allowedTypes.includes(imageFile.type)) {
					return fail(400, { error: 'Ungültiger Dateityp. Erlaubt: JPEG, PNG, WebP, GIF' });
				}

				// Validate file size (max 10MB)
				const maxSize = 10 * 1024 * 1024;
				if (imageFile.size > maxSize) {
					return fail(400, { error: 'Datei zu groß. Maximum: 10MB' });
				}

				const imagePaths = await processAndSaveImage(imageFile);
				await addCandidateImage(candidate.id, imagePaths);
			}

			return { success: true };
		} catch (error) {
			console.error('Error creating candidate:', error);
			return fail(500, { error: 'Fehler beim Erstellen des Kandidaten' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Kandidaten-ID erforderlich' });
		}

		try {
			const deleted = await deleteCandidate(id);
			if (!deleted) {
				return fail(404, { error: 'Kandidat nicht gefunden' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting candidate:', error);
			return fail(500, { error: 'Fehler beim Löschen des Kandidaten' });
		}
	}
};
