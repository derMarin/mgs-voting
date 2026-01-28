import type { PageServerLoad } from './$types.js';
import { getAllCategoriesWithCandidates } from '$lib/server/services/category.service.js';
import { getCandidateResults } from '$lib/server/services/vote.service.js';
import { db } from '$lib/server/db/index.js';
import { candidateImages, type CandidateImage } from '$lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';

type ResultWithImages = Awaited<ReturnType<typeof getCandidateResults>>[number] & {
	images: CandidateImage[];
};

export const load: PageServerLoad = async ({ url }) => {
	const selectedCategoryId = url.searchParams.get('category');
	const categories = await getAllCategoriesWithCandidates();

	let results: ResultWithImages[] = [];
	let selectedCategory = null;

	if (selectedCategoryId) {
		selectedCategory = categories.find((c) => c.id === selectedCategoryId);
		if (selectedCategory) {
			const baseResults = await getCandidateResults(selectedCategoryId);

			// Enrich results with candidate images
			results = await Promise.all(
				baseResults.map(async (result) => {
					const images = await db.query.candidateImages.findMany({
						where: eq(candidateImages.candidateId, result.candidateId),
						orderBy: [asc(candidateImages.sortOrder)]
					});

					return {
						...result,
						images
					};
				})
			);

			// Sort by average score descending
			results.sort((a, b) => b.averageScore - a.averageScore);
		}
	}

	return {
		categories,
		selectedCategoryId,
		selectedCategory,
		results
	};
};
