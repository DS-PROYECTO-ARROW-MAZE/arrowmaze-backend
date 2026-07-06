-- One-off recovery: remove leaked e2e test artifacts from the `niveles` table.
--
-- Context: the e2e suite (progress.e2e-spec.ts) was run against the live
-- Supabase DB and, on an aborted run, left an orphan level named
-- `hs-progress-<uuid>` (numero 17) behind. The authored catalogue is numero
-- 1..15, so anything outside that range is a test artifact.
--
-- `celdas_nivel` and `progresos` rows cascade-delete with their `niveles` row
-- (see schema.prisma onDelete: Cascade), so this is self-contained.
--
-- This CANNOT touch the authored catalogue (1..15). After running it, re-seed
-- with `npm run seed` (idempotent — creates 1..15, skips anything present).

DELETE FROM niveles WHERE numero < 1 OR numero > 15;
