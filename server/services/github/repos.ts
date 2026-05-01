import { and, eq } from 'drizzle-orm'
import { installations, repositories, userInstallations } from '../../db/schema'
import type { Database } from '../../db/client'

export async function getRepositoryForUser(
  db: Database,
  userId: number,
  owner: string,
  name: string,
) {
  const [row] = await db
    .select({
      repo: repositories,
      installation: installations,
    })
    .from(repositories)
    .innerJoin(
      installations,
      eq(repositories.installationId, installations.id),
    )
    .innerJoin(
      userInstallations,
      eq(userInstallations.installationId, installations.id),
    )
    .where(
      and(
        eq(userInstallations.userId, userId),
        eq(repositories.owner, owner),
        eq(repositories.name, name),
      ),
    )
    .limit(1)
  return row
}
