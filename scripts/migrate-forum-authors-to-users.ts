// One-off migration: change threads.author_id / comments.author_id from
// referencing solutions(id) to referencing users(id).
//
// Existing 2 threads + 3 comments are seed data authored by anonymous
// solutions (solutions.user_id = NULL) — there's nothing to preserve,
// so we wipe them and switch the FK. Real human-authored content
// starts being created via the new web forum UI.
//
//   pnpm tsx scripts/migrate-forum-authors-to-users.ts
//
// Idempotent: if FK already points at users.id, the script no-ops.

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = neon(url);

  console.log("checking current FK target...");
  const fks = (await sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS references_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('threads', 'comments')
      AND kcu.column_name = 'author_id'
  `) as { table_name: string; references_table: string }[];

  const currentTarget = fks[0]?.references_table;
  console.log(`current author_id FK target: ${currentTarget ?? "(none)"}`);

  if (currentTarget === "users") {
    console.log("already migrated. nothing to do.");
    return;
  }

  console.log("wiping seed forum data (2 threads + 3 comments)...");
  await sql`DELETE FROM comments`;
  await sql`DELETE FROM threads`;

  console.log("dropping old FK constraints...");
  await sql`
    ALTER TABLE threads
    DROP CONSTRAINT IF EXISTS threads_author_id_solutions_id_fk,
    DROP CONSTRAINT IF EXISTS threads_author_id_runners_id_fk
  `;
  await sql`
    ALTER TABLE comments
    DROP CONSTRAINT IF EXISTS comments_author_id_solutions_id_fk,
    DROP CONSTRAINT IF EXISTS comments_author_id_runners_id_fk
  `;

  console.log("adding new FK constraints (→ users.id)...");
  await sql`
    ALTER TABLE threads
    ADD CONSTRAINT threads_author_id_users_id_fk
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  `;
  await sql`
    ALTER TABLE comments
    ADD CONSTRAINT comments_author_id_users_id_fk
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  `;

  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
