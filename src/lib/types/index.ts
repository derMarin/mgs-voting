import type {
	Category,
	Candidate,
	CandidateImage,
	JuryMember,
	JuryCategoryAssignment,
	Vote
} from '$lib/server/db/schema.js';

// Voting status type
export type VotingStatus = 'idle' | 'active' | 'completed';

// Jury type
export type JuryType = 'core' | 'category';

// Extended types with relations
export interface CategoryWithCandidates extends Category {
	candidates: CandidateWithImages[];
}

export interface CandidateWithImages extends Candidate {
	images: CandidateImage[];
}

export interface CandidateWithVotes extends CandidateWithImages {
	votes: Vote[];
	averageScore?: number;
	totalVotes?: number;
}

export interface JuryMemberWithAssignments extends JuryMember {
	categoryAssignments: JuryCategoryAssignmentWithCategory[];
}

export interface JuryCategoryAssignmentWithCategory extends JuryCategoryAssignment {
	category: Category;
}

export interface VoteWithDetails extends Vote {
	juryMember: JuryMember;
	candidate: Candidate;
}

// SSE Event types
export interface SSEVotingStatusEvent {
	type: 'voting_status_changed';
	categoryId: string;
	status: VotingStatus;
	categoryName: string;
}

export interface SSEVoteReceivedEvent {
	type: 'vote_received';
	categoryId: string;
	candidateId: string;
	juryMemberId: string;
}

export type SSEEvent = SSEVotingStatusEvent | SSEVoteReceivedEvent;

// API Response types
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

// Form data types
export interface CategoryFormData {
	name: string;
	description?: string;
	sortOrder?: number;
}

export interface CandidateFormData {
	categoryId: string;
	name: string;
	description?: string;
	sortOrder?: number;
}

export interface JuryMemberFormData {
	name: string;
	juryType: JuryType;
	categoryIds?: string[]; // For category-type jury members
}

export interface VoteFormData {
	candidateId: string;
	score: number; // 1-10
}

// Results types
export interface CategoryResult {
	category: Category;
	candidates: CandidateResult[];
}

export interface CandidateResult {
	candidate: CandidateWithImages;
	averageScore: number;
	totalVotes: number;
	votes: VoteWithJuryMember[];
}

export interface VoteWithJuryMember extends Vote {
	juryMember: JuryMember;
}

// Session types
export interface AdminSession {
	isAuthenticated: boolean;
}

export interface JurySession {
	juryMemberId: string;
	juryMemberName: string;
	juryType: JuryType;
	allowedCategoryIds: string[] | null; // null means all categories (core jury)
}

// Re-export schema types
export type {
	Category,
	NewCategory,
	Candidate,
	NewCandidate,
	CandidateImage,
	NewCandidateImage,
	JuryMember,
	NewJuryMember,
	JuryCategoryAssignment,
	NewJuryCategoryAssignment,
	Vote,
	NewVote,
	AdminSetting,
	NewAdminSetting
} from '$lib/server/db/schema.js';
