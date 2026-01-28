import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { getAllCategories } from '$lib/server/services/category.service.js';
import {
	getJuryMemberWithAssignments,
	updateJuryMember
} from '$lib/server/services/jury.service.js';

export const load: PageServerLoad = async ({ params }) => {
	const juryMember = await getJuryMemberWithAssignments(params.id);

	if (!juryMember) {
		throw error(404, 'Jury-Mitglied nicht gefunden');
	}

	const categories = await getAllCategories();

	return { juryMember, categories };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const juryType = formData.get('juryType')?.toString() as 'core' | 'category';
		const categoryIds = formData.getAll('categoryIds').map((id) => id.toString());

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Name ist erforderlich' });
		}

		if (!juryType || !['core', 'category'].includes(juryType)) {
			return fail(400, { error: 'Ungültiger Jury-Typ' });
		}

		if (juryType === 'category' && categoryIds.length === 0) {
			return fail(400, { error: 'Mindestens eine Kategorie muss ausgewählt werden' });
		}

		try {
			const updated = await updateJuryMember(
				params.id,
				{
					name: name.trim(),
					juryType
				},
				categoryIds
			);

			if (!updated) {
				return fail(404, { error: 'Jury-Mitglied nicht gefunden' });
			}

			return { success: true };
		} catch (err) {
			console.error('Error updating jury member:', err);
			return fail(500, { error: 'Fehler beim Aktualisieren des Jury-Mitglieds' });
		}
	}
};
