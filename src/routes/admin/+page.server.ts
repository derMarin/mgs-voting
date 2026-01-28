import type { PageServerLoad } from './$types.js';
import { getAllCategories, getActiveVotingCategory } from '$lib/server/services/category.service.js';
import { db } from '$lib/server/db/index.js';
import { juryMembers, candidates, votes } from '$lib/server/db/schema.js';
import { count, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const [
		allCategories,
		activeCategory,
		juryCount,
		candidateCount,
		voteCount
	] = await Promise.all([
		getAllCategories(),
		getActiveVotingCategory(),
		db.select({ count: count() }).from(juryMembers).where(eq(juryMembers.isActive, 1)),
		db.select({ count: count() }).from(candidates),
		db.select({ count: count() }).from(votes)
	]);

	return {
		stats: {
			categories: allCategories.length,
			candidates: candidateCount[0]?.count ?? 0,
			juryMembers: juryCount[0]?.count ?? 0,
			votes: voteCount[0]?.count ?? 0
		},
		activeCategory,
		categories: allCategories
	};
};
