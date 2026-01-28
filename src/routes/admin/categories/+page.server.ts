import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import {
	getAllCategories,
	createCategory,
	deleteCategory
} from '$lib/server/services/category.service.js';

export const load: PageServerLoad = async () => {
	const categories = await getAllCategories();
	return { categories };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() || '0', 10);

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name ist erforderlich' });
		}

		try {
			await createCategory({
				name: name.trim(),
				description: description?.trim() || null,
				sortOrder
			});

			return { success: true };
		} catch (error) {
			console.error('Error creating category:', error);
			return fail(500, { error: 'Fehler beim Erstellen der Kategorie' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Kategorie-ID erforderlich' });
		}

		try {
			const deleted = await deleteCategory(id);
			if (!deleted) {
				return fail(404, { error: 'Kategorie nicht gefunden' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting category:', error);
			return fail(500, { error: 'Fehler beim Löschen der Kategorie' });
		}
	}
};
