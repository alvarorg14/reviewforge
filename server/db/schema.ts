import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  githubId: bigint('github_id', { mode: 'number' }).notNull().unique(),
  login: text('login').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  email: text('email'),
  /** AES-256-GCM ciphertext (base64); see server/services/crypto/secretBox.ts */
  cursorApiKeyEncrypted: text('cursor_api_key_encrypted'),
  cursorApiKeyUpdatedAt: timestamp('cursor_api_key_updated_at', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const installations = pgTable('installations', {
  id: serial('id').primaryKey(),
  githubInstallationId: bigint('github_installation_id', { mode: 'number' })
    .notNull()
    .unique(),
  accountLogin: text('account_login').notNull(),
  accountType: text('account_type').notNull(),
  accountId: bigint('account_id', { mode: 'number' }).notNull(),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const userInstallations = pgTable(
  'user_installations',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    installationId: integer('installation_id')
      .notNull()
      .references(() => installations.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.installationId] }),
  }),
)

export const repositories = pgTable(
  'repositories',
  {
    id: serial('id').primaryKey(),
    installationId: integer('installation_id')
      .notNull()
      .references(() => installations.id, { onDelete: 'cascade' }),
    githubRepoId: bigint('github_repo_id', { mode: 'number' })
      .notNull()
      .unique(),
    owner: text('owner').notNull(),
    name: text('name').notNull(),
    fullName: text('full_name').notNull(),
    private: boolean('private').notNull().default(false),
    defaultBranch: text('default_branch'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    /** Markdown injected into AI review prompts for this repo. */
    aiContext: text('ai_context'),
    /** When false, the prompt instructs the agent never to submit GitHub APPROVE. */
    aiAllowApprove: boolean('ai_allow_approve').notNull().default(true),
    /** One of: concise | thorough | security */
    aiReviewStyle: text('ai_review_style').notNull().default('thorough'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    ownerNameIdx: index('repositories_owner_name_idx').on(t.owner, t.name),
  }),
)

export const aiReviewRuns = pgTable(
  'ai_review_runs',
  {
    id: serial('id').primaryKey(),
    repositoryId: integer('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
    prNumber: integer('pr_number').notNull(),
    requestedByUserId: integer('requested_by_user_id')
      .notNull()
      .references(() => users.id),
    status: text('status').notNull(),
    cursorAgentId: text('cursor_agent_id'),
    summary: text('summary'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => ({
    repoPrIdx: index('ai_review_runs_repo_pr_idx').on(t.repositoryId, t.prNumber),
  }),
)
