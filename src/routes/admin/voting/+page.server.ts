import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import {
	getAllCategoriesWithCandidates,
	setVotingStatus,
	stopAllVoting,
	getCategoryById
} from '$lib/server/services/category.service.js';
import { getJuryMembersByCategory } from '$lib/server/services/jury.service.js';
import { getCandidateResults, deleteAllVotesForCategory } from '$lib/server/services/vote.service.js';
import { sseManager } from '$lib/server/sse/manager.js';

export const load: PageServerLoad = async () => {
	const categories = await getAllCategoriesWithCandidates();

	// Get voting stats for each category
	const categoriesWithStats = await Promise.all(
		categories.map(async (category) => {
			const results = await getCandidateResults(category.id);
			const eligibleJury = await getJuryMembersByCategory(category.id);

			const totalVotes = results.reduce((sum, r) => sum + r.totalVotes, 0);
			const candidatesCount = category.candidates.length;
			const expectedVotes = eligibleJury.length * candidatesCount;

			return {
				...category,
				stats: {
					totalVotes,
					expectedVotes,
					completionPercentage:
						expectedVotes > 0 ? Math.round((totalVotes / expectedVotes) * 100) : 0,
					juryCount: eligibleJury.length,
					candidatesCount
				}
			};
		})
	);

	return { categories: categoriesWithStats };
};

export const actions: Actions = {
	startVoting: async ({ request }) => {
		const formData = await request.formData();
		const categoryId = formData.get('categoryId')?.toString();

		if (!categoryId) {
			return fail(400, { error: 'Kategorie-ID erforderlich' });
		}

		try {
			// Stop any currently active voting first
			await stopAllVoting();

			// Start voting for selected category
			const updated = await setVotingStatus(categoryId, 'active');

			if (!updated) {
				return fail(404, { error: 'Kategorie nicht gefunden' });
			}

			// Broadcast SSE event
			sseManager.broadcastVotingStatusChange(categoryId, 'active', updated.name);

			return { success: true, action: 'started' };
		} catch (error) {
			console.error('Error starting voting:', error);
			return fail(500, { error: 'Fehler beim Starten des Votings' });
		}
	},

	stopVoting: async ({ request }) => {
		const formData = await request.formData();
		const categoryId = formData.get('categoryId')?.toString();

		if (!categoryId) {
			return fail(400, { error: 'Kategorie-ID erforderlich' });
		}

		try {
			const updated = await setVotingStatus(categoryId, 'idle');

			if (!updated) {
				return fail(404, { error: 'Kategorie nicht gefunden' });
			}

			// Broadcast SSE event
			sseManager.broadcastVotingStatusChange(categoryId, 'idle', updated.name);

			return { success: true, action: 'stopped' };
		} catch (error) {
			console.error('Error stopping voting:', error);
			return fail(500, { error: 'Fehler beim Stoppen des Votings' });
		}
	},

	completeVoting: async ({ request }) => {
		const formData = await request.formData();
		const categoryId = formData.get('categoryId')?.toString();

		if (!categoryId) {
			return fail(400, { error: 'Kategorie-ID erforderlich' });
		}

		try {
			const updated = await setVotingStatus(categoryId, 'completed');

			if (!updated) {
				return fail(404, { error: 'Kategorie nicht gefunden' });
			}

			// Broadcast SSE event
			sseManager.broadcastVotingStatusChange(categoryId, 'completed', updated.name);

			return { success: true, action: 'completed' };
		} catch (error) {
			console.error('Error completing voting:', error);
			return fail(500, { error: 'Fehler beim Abschließen des Votings' });
		}
	},

	resetVoting: async ({ request }) => {
		const formData = await request.formData();
		const categoryId = formData.get('categoryId')?.toString();

		if (!categoryId) {
			return fail(400, { error: 'Kategorie-ID erforderlich' });
		}

		try {
			// Delete all votes for this category
			const deletedVotes = await deleteAllVotesForCategory(categoryId);
			console.log(`Deleted ${deletedVotes} votes for category ${categoryId}`);

			// Reset voting status to idle
			const updated = await setVotingStatus(categoryId, 'idle');

			if (!updated) {
				return fail(404, { error: 'Kategorie nicht gefunden' });
			}

			// Broadcast SSE event
			sseManager.broadcastVotingStatusChange(categoryId, 'idle', updated.name);

			return { success: true, action: 'reset' };
		} catch (error) {
			console.error('Error resetting voting:', error);
			return fail(500, { error: 'Fehler beim Zurücksetzen des Votings' });
		}
	}
};
