import { pgTable, text, integer, timestamp, uuid, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const votingStatusEnum = pgEnum('voting_status', ['idle', 'active', 'completed']);
export const juryTypeEnum = pgEnum('jury_type', ['core', 'category']);

// Categories table
export const categories = pgTable('categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	votingStatus: votingStatusEnum('voting_status').default('idle').notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Candidates table
export const candidates = pgTable('candidates', {
	id: uuid('id').defaultRandom().primaryKey(),
	categoryId: uuid('category_id')
		.references(() => categories.id, { onDelete: 'cascade' })
		.notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'), // HTML content from TipTap
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Candidate images table
export const candidateImages = pgTable('candidate_images', {
	id: uuid('id').defaultRandom().primaryKey(),
	candidateId: uuid('candidate_id')
		.references(() => candidates.id, { onDelete: 'cascade' })
		.notNull(),
	originalPath: varchar('original_path', { length: 500 }).notNull(),
	largePath: varchar('large_path', { length: 500 }).notNull(),
	mediumPath: varchar('medium_path', { length: 500 }).notNull(),
	thumbnailPath: varchar('thumbnail_path', { length: 500 }).notNull(),
	sortOrder: integer('sort_order').default(0).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Jury members table
export const juryMembers = pgTable('jury_members', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	juryType: juryTypeEnum('jury_type').notNull(),
	accessToken: varchar('access_token', { length: 64 }).unique().notNull(),
	isActive: integer('is_active').default(1).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Jury category assignments (for category-specific jury members)
export const juryCategoryAssignments = pgTable('jury_category_assignments', {
	id: uuid('id').defaultRandom().primaryKey(),
	juryMemberId: uuid('jury_member_id')
		.references(() => juryMembers.id, { onDelete: 'cascade' })
		.notNull(),
	categoryId: uuid('category_id')
		.references(() => categories.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Votes table
export const votes = pgTable('votes', {
	id: uuid('id').defaultRandom().primaryKey(),
	juryMemberId: uuid('jury_member_id')
		.references(() => juryMembers.id, { onDelete: 'cascade' })
		.notNull(),
	candidateId: uuid('candidate_id')
		.references(() => candidates.id, { onDelete: 'cascade' })
		.notNull(),
	score: integer('score').notNull(), // 1-10
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Admin settings table
export const adminSettings = pgTable('admin_settings', {
	id: uuid('id').defaultRandom().primaryKey(),
	key: varchar('key', { length: 100 }).unique().notNull(),
	value: text('value'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
	candidates: many(candidates),
	juryCategoryAssignments: many(juryCategoryAssignments)
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
	category: one(categories, {
		fields: [candidates.categoryId],
		references: [categories.id]
	}),
	images: many(candidateImages),
	votes: many(votes)
}));

export const candidateImagesRelations = relations(candidateImages, ({ one }) => ({
	candidate: one(candidates, {
		fields: [candidateImages.candidateId],
		references: [candidates.id]
	})
}));

export const juryMembersRelations = relations(juryMembers, ({ many }) => ({
	categoryAssignments: many(juryCategoryAssignments),
	votes: many(votes)
}));

export const juryCategoryAssignmentsRelations = relations(juryCategoryAssignments, ({ one }) => ({
	juryMember: one(juryMembers, {
		fields: [juryCategoryAssignments.juryMemberId],
		references: [juryMembers.id]
	}),
	category: one(categories, {
		fields: [juryCategoryAssignments.categoryId],
		references: [categories.id]
	})
}));

export const votesRelations = relations(votes, ({ one }) => ({
	juryMember: one(juryMembers, {
		fields: [votes.juryMemberId],
		references: [juryMembers.id]
	}),
	candidate: one(candidates, {
		fields: [votes.candidateId],
		references: [candidates.id]
	})
}));

// Type exports
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type CandidateImage = typeof candidateImages.$inferSelect;
export type NewCandidateImage = typeof candidateImages.$inferInsert;
export type JuryMember = typeof juryMembers.$inferSelect;
export type NewJuryMember = typeof juryMembers.$inferInsert;
export type JuryCategoryAssignment = typeof juryCategoryAssignments.$inferSelect;
export type NewJuryCategoryAssignment = typeof juryCategoryAssignments.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type NewAdminSetting = typeof adminSettings.$inferInsert;
