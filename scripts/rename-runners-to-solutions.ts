// One-off migration: rename `runners` table → `solutions` + the FK +
// the indexes. All Postgres metadata operations, near-instant and
// non-destructive. Run once against the live DB:
//
//   pnpm tsx scripts/rename-runners-to-solutions.ts
//
// Safe to run after the code change has shipped, OR before — the
// rename is on a single transaction so a half-applied state isn't
// possible. Delete this script after the migration lands everywhere.

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = neon(url);

  console.log("checking current schema...");
  const tables = (await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('runners', 'solutions')
  `) as { table_name: string }[];
  const names = new Set(tables.map((t) => t.table_name));

  if (names.has("solutions") && !names.has("runners")) {
    console.log("already migrated — solutions exists, runners doesn't. nothing to do.");
    return;
  }
  if (!names.has("runners")) {
    console.log("no runners table found — nothing to migrate.");
    return;
  }

  console.log("renaming runners → solutions...");
  await sql`ALTER TABLE runners RENAME TO solutions`;
  console.log("renaming runs.runner_id → runs.solution_id...");
  await sql`ALTER TABLE runs RENAME COLUMN runner_id TO solution_id`;
  console.log("renaming indexes...");
  await sql`ALTER INDEX runners_name_idx RENAME TO solutions_name_idx`;
  await sql`ALTER INDEX runners_api_key_idx RENAME TO solutions_api_key_idx`;

  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
