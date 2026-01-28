import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { getAllCategories } from '$lib/server/services/category.service.js';
import {
	getAllJuryMembersWithAssignments,
	createJuryMember,
	deleteJuryMember,
	toggleJuryMemberActive
} from '$lib/server/services/jury.service.js';
import { regenerateJuryToken } from '$lib/server/auth/jury.js';

export const load: PageServerLoad = async () => {
	const [juryMembers, categories] = await Promise.all([
		getAllJuryMembersWithAssignments(),
		getAllCategories()
	]);

	return { juryMembers, categories };
};

export const actions: Actions = {
	create: async ({ request }) => {
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
			await createJuryMember(
				{
					name: name.trim(),
					juryType
				},
				categoryIds
			);

			return { success: true };
		} catch (error) {
			console.error('Error creating jury member:', error);
			return fail(500, { error: 'Fehler beim Erstellen des Jury-Mitglieds' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Jury-Mitglied-ID erforderlich' });
		}

		try {
			const deleted = await deleteJuryMember(id);
			if (!deleted) {
				return fail(404, { error: 'Jury-Mitglied nicht gefunden' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error deleting jury member:', error);
			return fail(500, { error: 'Fehler beim Löschen des Jury-Mitglieds' });
		}
	},

	toggleActive: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Jury-Mitglied-ID erforderlich' });
		}

		try {
			const updated = await toggleJuryMemberActive(id);
			if (!updated) {
				return fail(404, { error: 'Jury-Mitglied nicht gefunden' });
			}

			return { success: true };
		} catch (error) {
			console.error('Error toggling jury member status:', error);
			return fail(500, { error: 'Fehler beim Ändern des Status' });
		}
	},

	regenerateToken: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Jury-Mitglied-ID erforderlich' });
		}

		try {
			const newToken = await regenerateJuryToken(id);
			if (!newToken) {
				return fail(404, { error: 'Jury-Mitglied nicht gefunden' });
			}

			return { success: true, tokenRegenerated: true };
		} catch (error) {
			console.error('Error regenerating token:', error);
			return fail(500, { error: 'Fehler beim Generieren des neuen Tokens' });
		}
	}
};
