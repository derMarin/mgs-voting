import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getAllCategories } from '$lib/server/services/category.service.js';
import {
	getCandidatesByCategory,
	createCandidate,
	deleteCandidate,
	addCandidateImage
} from '$lib/server/services/candidate.service.js';
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

		// Image URLs from client-side upload
		const originalPath = formData.get('originalPath')?.toString();
		const largePath = formData.get('largePath')?.toString();
		const mediumPath = formData.get('mediumPath')?.toString();
		const thumbnailPath = formData.get('thumbnailPath')?.toString();

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

			// Save image URLs if provided (uploaded directly to Supabase from client)
			if (originalPath && largePath && mediumPath && thumbnailPath) {
				await addCandidateImage(candidate.id, {
					originalPath,
					largePath,
					mediumPath,
					thumbnailPath
				});
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
