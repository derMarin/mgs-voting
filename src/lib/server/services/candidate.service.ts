import { db } from '$lib/server/db/index.js';
import { candidates, candidateImages } from '$lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import type { Candidate, NewCandidate, CandidateWithImages } from '$lib/types/index.js';

export async function getAllCandidates(): Promise<Candidate[]> {
	return db.query.candidates.findMany({
		orderBy: [asc(candidates.sortOrder), asc(candidates.name)]
	});
}

export async function getCandidatesByCategory(categoryId: string): Promise<CandidateWithImages[]> {
	const result = await db.query.candidates.findMany({
		where: eq(candidates.categoryId, categoryId),
		orderBy: [asc(candidates.sortOrder), asc(candidates.name)],
		with: {
			images: {
				orderBy: [asc(candidateImages.sortOrder)]
			}
		}
	});

	return result as CandidateWithImages[];
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
	return db.query.candidates.findFirst({
		where: eq(candidates.id, id)
	});
}

export async function getCandidateWithImages(id: string): Promise<CandidateWithImages | undefined> {
	const result = await db.query.candidates.findFirst({
		where: eq(candidates.id, id),
		with: {
			images: {
				orderBy: [asc(candidateImages.sortOrder)]
			}
		}
	});

	return result as CandidateWithImages | undefined;
}

export async function createCandidate(
	data: Omit<NewCandidate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Candidate> {
	const [candidate] = await db
		.insert(candidates)
		.values({
			categoryId: data.categoryId,
			name: data.name,
			description: data.description,
			sortOrder: data.sortOrder ?? 0
		})
		.returning();

	return candidate;
}

export async function updateCandidate(
	id: string,
	data: Partial<Omit<NewCandidate, 'id' | 'createdAt'>>
): Promise<Candidate | null> {
	const [candidate] = await db
		.update(candidates)
		.set({
			...data,
			updatedAt: new Date()
		})
		.where(eq(candidates.id, id))
		.returning();

	return candidate ?? null;
}

export async function deleteCandidate(id: string): Promise<boolean> {
	const result = await db.delete(candidates).where(eq(candidates.id, id)).returning();
	return result.length > 0;
}

export async function addCandidateImage(
	candidateId: string,
	imagePaths: {
		originalPath: string;
		largePath: string;
		mediumPath: string;
		thumbnailPath: string;
	},
	sortOrder: number = 0
): Promise<typeof candidateImages.$inferSelect> {
	const [image] = await db
		.insert(candidateImages)
		.values({
			candidateId,
			...imagePaths,
			sortOrder
		})
		.returning();

	return image;
}

export async function deleteCandidateImage(imageId: string): Promise<boolean> {
	const result = await db.delete(candidateImages).where(eq(candidateImages.id, imageId)).returning();
	return result.length > 0;
}

export async function getCandidateImages(
	candidateId: string
): Promise<(typeof candidateImages.$inferSelect)[]> {
	return db.query.candidateImages.findMany({
		where: eq(candidateImages.candidateId, candidateId),
		orderBy: [asc(candidateImages.sortOrder)]
	});
}
