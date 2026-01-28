import type { PageServerLoad, Actions } from './$types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import {
	getCategoryWithCandidates,
	updateCategory
} from '$lib/server/services/category.service.js';

export const load: PageServerLoad = async ({ params }) => {
	const category = await getCategoryWithCandidates(params.id);

	if (!category) {
		throw error(404, 'Kategorie nicht gefunden');
	}

	return { category };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() || '0', 10);

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name ist erforderlich' });
		}

		try {
			const updated = await updateCategory(params.id, {
				name: name.trim(),
				description: description?.trim() || null,
				sortOrder
			});

			if (!updated) {
				return fail(404, { error: 'Kategorie nicht gefunden' });
			}

			return { success: true };
		} catch (err) {
			console.error('Error updating category:', err);
			return fail(500, { error: 'Fehler beim Aktualisieren der Kategorie' });
		}
	}
};
