import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { getActiveVotingCategory, getCategoryWithCandidates } from '$lib/server/services/category.service.js';
import { submitVote, getJuryMemberVotesForCategory } from '$lib/server/services/vote.service.js';
import { canJuryMemberVoteInCategory } from '$lib/server/auth/jury.js';
import { sseManager } from '$lib/server/sse/manager.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.jury) {
		throw error(404, 'Not Found');
	}

	const { id, name, juryType, allowedCategoryIds } = locals.jury;

	// Get the currently active voting category
	const activeCategory = await getActiveVotingCategory();

	if (!activeCategory) {
		return {
			juryMember: { id, name, juryType },
			activeCategory: null,
			candidates: [],
			votes: {} as Record<string, number>,
			canVote: false
		};
	}

	// Check if this jury member can vote in the active category
	const canVote = canJuryMemberVoteInCategory(allowedCategoryIds, activeCategory.id);

	if (!canVote) {
		return {
			juryMember: { id, name, juryType },
			activeCategory,
			candidates: [],
			votes: {} as Record<string, number>,
			canVote: false
		};
	}

	// Get candidates for the active category
	const categoryWithCandidates = await getCategoryWithCandidates(activeCategory.id);

	// Get existing votes by this jury member for this category
	const existingVotes = await getJuryMemberVotesForCategory(id, activeCategory.id);

	return {
		juryMember: { id, name, juryType },
		activeCategory,
		candidates: categoryWithCandidates?.candidates || [],
		votes: Object.fromEntries(existingVotes),
		canVote: true
	};
};

export const actions: Actions = {
	vote: async ({ request, locals }) => {
		if (!locals.jury) {
			return fail(401, { error: 'Nicht autorisiert' });
		}

		const formData = await request.formData();
		const candidateId = formData.get('candidateId')?.toString();
		const scoreStr = formData.get('score')?.toString();

		if (!candidateId) {
			return fail(400, { error: 'Kandidaten-ID erforderlich' });
		}

		if (!scoreStr) {
			return fail(400, { error: 'Bewertung erforderlich' });
		}

		const score = parseInt(scoreStr, 10);
		if (isNaN(score) || score < 1 || score > 10) {
			return fail(400, { error: 'Bewertung muss zwischen 1 und 10 liegen' });
		}

		const result = await submitVote(
			locals.jury.id,
			candidateId,
			score,
			locals.jury.allowedCategoryIds
		);

		if (!result.success) {
			return fail(400, { error: result.error });
		}

		// Broadcast vote received event for live updates
		if (result.categoryId) {
			sseManager.broadcastVoteReceived(result.categoryId, candidateId, locals.jury.id);
		}

		return { success: true, candidateId, score };
	}
};
