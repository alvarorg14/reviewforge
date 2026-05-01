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
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    ownerNameIdx: index('repositories_owner_name_idx').on(t.owner, t.name),
  }),
)
