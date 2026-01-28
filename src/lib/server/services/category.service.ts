import { db } from '$lib/server/db/index.js';
import { categories, candidates, candidateImages } from '$lib/server/db/schema.js';
import { eq, asc, desc } from 'drizzle-orm';
import type { Category, NewCategory, CategoryWithCandidates } from '$lib/types/index.js';

export async function getAllCategories(): Promise<Category[]> {
	return db.query.categories.findMany({
		orderBy: [asc(categories.sortOrder), asc(categories.name)]
	});
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
	return db.query.categories.findFirst({
		where: eq(categories.id, id)
	});
}

export async function getCategoryWithCandidates(id: string): Promise<CategoryWithCandidates | undefined> {
	const category = await db.query.categories.findFirst({
		where: eq(categories.id, id),
		with: {
			candidates: {
				orderBy: [asc(candidates.sortOrder), asc(candidates.name)],
				with: {
					images: {
						orderBy: [asc(candidateImages.sortOrder)]
					}
				}
			}
		}
	});

	return category as CategoryWithCandidates | undefined;
}

export async function getAllCategoriesWithCandidates(): Promise<CategoryWithCandidates[]> {
	const result = await db.query.categories.findMany({
		orderBy: [asc(categories.sortOrder), asc(categories.name)],
		with: {
			candidates: {
				orderBy: [asc(candidates.sortOrder), asc(candidates.name)],
				with: {
					images: {
						orderBy: [asc(candidateImages.sortOrder)]
					}
				}
			}
		}
	});

	return result as CategoryWithCandidates[];
}

export async function createCategory(data: Omit<NewCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
	const [category] = await db
		.insert(categories)
		.values({
			name: data.name,
			description: data.description,
			sortOrder: data.sortOrder ?? 0,
			votingStatus: data.votingStatus ?? 'idle'
		})
		.returning();

	return category;
}

export async function updateCategory(
	id: string,
	data: Partial<Omit<NewCategory, 'id' | 'createdAt'>>
): Promise<Category | null> {
	const [category] = await db
		.update(categories)
		.set({
			...data,
			updatedAt: new Date()
		})
		.where(eq(categories.id, id))
		.returning();

	return category ?? null;
}

export async function deleteCategory(id: string): Promise<boolean> {
	const result = await db.delete(categories).where(eq(categories.id, id)).returning();
	return result.length > 0;
}

export async function setVotingStatus(
	id: string,
	status: 'idle' | 'active' | 'completed'
): Promise<Category | null> {
	return updateCategory(id, { votingStatus: status });
}

export async function getActiveVotingCategory(): Promise<Category | undefined> {
	return db.query.categories.findFirst({
		where: eq(categories.votingStatus, 'active')
	});
}

export async function stopAllVoting(): Promise<void> {
	await db
		.update(categories)
		.set({ votingStatus: 'idle', updatedAt: new Date() })
		.where(eq(categories.votingStatus, 'active'));
}
