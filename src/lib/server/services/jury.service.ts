import { db } from '$lib/server/db/index.js';
import { juryMembers, juryCategoryAssignments } from '$lib/server/db/schema.js';
import { eq, asc, and } from 'drizzle-orm';
import { generateAccessToken } from '$lib/server/auth/jury.js';
import type { JuryMember, NewJuryMember, JuryMemberWithAssignments } from '$lib/types/index.js';

export async function getAllJuryMembers(): Promise<JuryMember[]> {
	return db.query.juryMembers.findMany({
		orderBy: [asc(juryMembers.name)]
	});
}

export async function getJuryMemberById(id: string): Promise<JuryMember | undefined> {
	return db.query.juryMembers.findFirst({
		where: eq(juryMembers.id, id)
	});
}

export async function getJuryMemberWithAssignments(
	id: string
): Promise<JuryMemberWithAssignments | undefined> {
	const member = await db.query.juryMembers.findFirst({
		where: eq(juryMembers.id, id),
		with: {
			categoryAssignments: {
				with: {
					category: true
				}
			}
		}
	});

	return member as JuryMemberWithAssignments | undefined;
}

export async function getAllJuryMembersWithAssignments(): Promise<JuryMemberWithAssignments[]> {
	const members = await db.query.juryMembers.findMany({
		orderBy: [asc(juryMembers.name)],
		with: {
			categoryAssignments: {
				with: {
					category: true
				}
			}
		}
	});

	return members as JuryMemberWithAssignments[];
}

export async function createJuryMember(
	data: Omit<NewJuryMember, 'id' | 'accessToken' | 'createdAt' | 'updatedAt'>,
	categoryIds?: string[]
): Promise<JuryMember> {
	const accessToken = await generateAccessToken();

	const [juryMember] = await db
		.insert(juryMembers)
		.values({
			name: data.name,
			juryType: data.juryType,
			accessToken,
			isActive: data.isActive ?? 1
		})
		.returning();

	// Create category assignments for category-type jury members
	if (data.juryType === 'category' && categoryIds && categoryIds.length > 0) {
		await db.insert(juryCategoryAssignments).values(
			categoryIds.map((categoryId) => ({
				juryMemberId: juryMember.id,
				categoryId
			}))
		);
	}

	return juryMember;
}

export async function updateJuryMember(
	id: string,
	data: Partial<Omit<NewJuryMember, 'id' | 'accessToken' | 'createdAt'>>,
	categoryIds?: string[]
): Promise<JuryMember | null> {
	const [juryMember] = await db
		.update(juryMembers)
		.set({
			...data,
			updatedAt: new Date()
		})
		.where(eq(juryMembers.id, id))
		.returning();

	if (!juryMember) {
		return null;
	}

	// Update category assignments if provided
	if (categoryIds !== undefined) {
		// Delete existing assignments
		await db.delete(juryCategoryAssignments).where(eq(juryCategoryAssignments.juryMemberId, id));

		// Create new assignments for category-type jury members
		if (juryMember.juryType === 'category' && categoryIds.length > 0) {
			await db.insert(juryCategoryAssignments).values(
				categoryIds.map((categoryId) => ({
					juryMemberId: id,
					categoryId
				}))
			);
		}
	}

	return juryMember;
}

export async function deleteJuryMember(id: string): Promise<boolean> {
	const result = await db.delete(juryMembers).where(eq(juryMembers.id, id)).returning();
	return result.length > 0;
}

export async function toggleJuryMemberActive(id: string): Promise<JuryMember | null> {
	const member = await getJuryMemberById(id);
	if (!member) {
		return null;
	}

	const [updated] = await db
		.update(juryMembers)
		.set({
			isActive: member.isActive ? 0 : 1,
			updatedAt: new Date()
		})
		.where(eq(juryMembers.id, id))
		.returning();

	return updated ?? null;
}

export async function getActiveJuryMembers(): Promise<JuryMember[]> {
	return db.query.juryMembers.findMany({
		where: eq(juryMembers.isActive, 1),
		orderBy: [asc(juryMembers.name)]
	});
}

export async function getJuryMembersByCategory(categoryId: string): Promise<JuryMember[]> {
	// Get core jury members (they can vote in all categories)
	const coreMembers = await db.query.juryMembers.findMany({
		where: and(eq(juryMembers.juryType, 'core'), eq(juryMembers.isActive, 1)),
		orderBy: [asc(juryMembers.name)]
	});

	// Get category-specific jury members assigned to this category
	const categoryAssignments = await db.query.juryCategoryAssignments.findMany({
		where: eq(juryCategoryAssignments.categoryId, categoryId),
		with: {
			juryMember: true
		}
	});

	const categoryMembers = categoryAssignments
		.map((a) => a.juryMember)
		.filter((m) => m.isActive);

	// Combine and dedupe
	const allMembers = [...coreMembers, ...categoryMembers];
	const uniqueMembers = Array.from(new Map(allMembers.map((m) => [m.id, m])).values());

	return uniqueMembers;
}
