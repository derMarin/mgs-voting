import { db } from '$lib/server/db/index.js';
import { votes, candidates, categories, juryMembers } from '$lib/server/db/schema.js';
import { eq, and, asc } from 'drizzle-orm';
import type { Vote, NewVote } from '$lib/types/index.js';
import { canJuryMemberVoteInCategory } from '$lib/server/auth/jury.js';

interface VoteResult {
	success: boolean;
	error?: string;
	vote?: Vote;
	categoryId?: string;
}

export async function submitVote(
	juryMemberId: string,
	candidateId: string,
	score: number,
	allowedCategoryIds: string[] | null
): Promise<VoteResult> {
	// Validate score
	if (score < 1 || score > 10 || !Number.isInteger(score)) {
		return { success: false, error: 'Bewertung muss zwischen 1 und 10 liegen' };
	}

	// Get candidate with category
	const candidate = await db.query.candidates.findFirst({
		where: eq(candidates.id, candidateId),
		with: {
			category: true
		}
	});

	if (!candidate) {
		return { success: false, error: 'Kandidat nicht gefunden' };
	}

	// Check if voting is active for this category
	if (candidate.category.votingStatus !== 'active') {
		return { success: false, error: 'Voting für diese Kategorie ist nicht aktiv' };
	}

	// Check if jury member is allowed to vote in this category
	if (!canJuryMemberVoteInCategory(allowedCategoryIds, candidate.categoryId)) {
		return { success: false, error: 'Sie sind nicht berechtigt, in dieser Kategorie abzustimmen' };
	}

	// Check if jury member already voted for this candidate
	const existingVote = await db.query.votes.findFirst({
		where: and(eq(votes.juryMemberId, juryMemberId), eq(votes.candidateId, candidateId))
	});

	let vote: Vote;

	if (existingVote) {
		// Update existing vote
		const [updated] = await db
			.update(votes)
			.set({
				score,
				updatedAt: new Date()
			})
			.where(eq(votes.id, existingVote.id))
			.returning();

		vote = updated;
	} else {
		// Create new vote
		const [created] = await db
			.insert(votes)
			.values({
				juryMemberId,
				candidateId,
				score
			})
			.returning();

		vote = created;
	}

	return { success: true, vote, categoryId: candidate.categoryId };
}

export async function getVotesByCandidate(candidateId: string): Promise<Vote[]> {
	return db.query.votes.findMany({
		where: eq(votes.candidateId, candidateId),
		orderBy: [asc(votes.createdAt)]
	});
}

export async function getVotesByJuryMember(juryMemberId: string): Promise<Vote[]> {
	return db.query.votes.findMany({
		where: eq(votes.juryMemberId, juryMemberId),
		orderBy: [asc(votes.createdAt)]
	});
}

export async function getVotesByCategory(categoryId: string): Promise<Vote[]> {
	// Get all candidates in this category
	const categoryCandidates = await db.query.candidates.findMany({
		where: eq(candidates.categoryId, categoryId)
	});

	const candidateIds = categoryCandidates.map((c) => c.id);

	if (candidateIds.length === 0) {
		return [];
	}

	// Get all votes for these candidates
	const allVotes: Vote[] = [];
	for (const candidateId of candidateIds) {
		const candidateVotes = await db.query.votes.findMany({
			where: eq(votes.candidateId, candidateId)
		});
		allVotes.push(...candidateVotes);
	}

	return allVotes;
}

export async function getJuryMemberVotesForCategory(
	juryMemberId: string,
	categoryId: string
): Promise<Map<string, number>> {
	// Get all candidates in this category
	const categoryCandidates = await db.query.candidates.findMany({
		where: eq(candidates.categoryId, categoryId)
	});

	const candidateIds = categoryCandidates.map((c) => c.id);

	// Get votes by this jury member for these candidates
	const juryVotes = await db.query.votes.findMany({
		where: eq(votes.juryMemberId, juryMemberId)
	});

	// Filter to only votes for candidates in this category
	const categoryVotes = juryVotes.filter((v) => candidateIds.includes(v.candidateId));

	// Return as map of candidateId -> score
	return new Map(categoryVotes.map((v) => [v.candidateId, v.score]));
}

export async function getCandidateResults(categoryId: string): Promise<
	{
		candidateId: string;
		candidateName: string;
		averageScore: number;
		totalVotes: number;
		votes: Array<{
			juryMemberId: string;
			juryMemberName: string;
			score: number;
		}>;
	}[]
> {
	// Get all candidates in this category with their votes
	const categoryCandidates = await db.query.candidates.findMany({
		where: eq(candidates.categoryId, categoryId),
		orderBy: [asc(candidates.sortOrder), asc(candidates.name)],
		with: {
			votes: {
				with: {
					juryMember: true
				}
			}
		}
	});

	return categoryCandidates.map((candidate) => {
		const candidateVotes = candidate.votes || [];
		const totalVotes = candidateVotes.length;
		const averageScore =
			totalVotes > 0
				? candidateVotes.reduce((sum, v) => sum + v.score, 0) / totalVotes
				: 0;

		return {
			candidateId: candidate.id,
			candidateName: candidate.name,
			averageScore: Math.round(averageScore * 100) / 100,
			totalVotes,
			votes: candidateVotes.map((v) => ({
				juryMemberId: v.juryMemberId,
				juryMemberName: v.juryMember.name,
				score: v.score
			}))
		};
	});
}

export async function deleteVote(voteId: string): Promise<boolean> {
	const result = await db.delete(votes).where(eq(votes.id, voteId)).returning();
	return result.length > 0;
}

export async function deleteAllVotesForCategory(categoryId: string): Promise<number> {
	// Get all candidates in this category
	const categoryCandidates = await db.query.candidates.findMany({
		where: eq(candidates.categoryId, categoryId)
	});

	let deletedCount = 0;
	for (const candidate of categoryCandidates) {
		const result = await db
			.delete(votes)
			.where(eq(votes.candidateId, candidate.id))
			.returning();
		deletedCount += result.length;
	}

	return deletedCount;
}
