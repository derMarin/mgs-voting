import { db } from '$lib/server/db/index.js';
import { juryMembers, juryCategoryAssignments } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { JuryMember } from '$lib/types/index.js';

export async function generateAccessToken(): Promise<string> {
	// Generate a secure random token
	return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 32);
}

export async function validateJuryToken(token: string): Promise<{
	isValid: boolean;
	juryMember?: JuryMember;
	allowedCategoryIds?: string[] | null;
}> {
	if (!token || token.length < 32) {
		return { isValid: false };
	}

	const juryMember = await db.query.juryMembers.findFirst({
		where: eq(juryMembers.accessToken, token)
	});

	if (!juryMember || !juryMember.isActive) {
		return { isValid: false };
	}

	// Get allowed category IDs for category-type jury members
	let allowedCategoryIds: string[] | null = null;

	if (juryMember.juryType === 'category') {
		const assignments = await db.query.juryCategoryAssignments.findMany({
			where: eq(juryCategoryAssignments.juryMemberId, juryMember.id)
		});
		allowedCategoryIds = assignments.map((a) => a.categoryId);
	}

	return {
		isValid: true,
		juryMember,
		allowedCategoryIds
	};
}

export async function regenerateJuryToken(juryMemberId: string): Promise<string | null> {
	const newToken = await generateAccessToken();

	const result = await db
		.update(juryMembers)
		.set({
			accessToken: newToken,
			updatedAt: new Date()
		})
		.where(eq(juryMembers.id, juryMemberId))
		.returning();

	return result.length > 0 ? newToken : null;
}

export function canJuryMemberVoteInCategory(
	allowedCategoryIds: string[] | null,
	categoryId: string
): boolean {
	// Core jury can vote in all categories
	if (allowedCategoryIds === null) {
		return true;
	}

	// Category jury can only vote in assigned categories
	return allowedCategoryIds.includes(categoryId);
}
