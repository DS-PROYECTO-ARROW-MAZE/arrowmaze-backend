-- High-score persistence (ticket 13): one best row per (jugador, nivel).
--
-- ⚠️ IRREVERSIBILITY NOTE: this migration is LOSSY and cannot be cleanly rolled back.
-- The dedup step below permanently DELETEs every run except the best one per
-- (jugador_id, nivel_id); the discarded historical rows cannot be recovered.

-- 1. Data migration FIRST: collapse pre-existing duplicates to the single best per
--    (jugador, nivel). We keep the row with the highest puntaje, breaking exact ties
--    deterministically on id so exactly one row survives each pair — otherwise the
--    unique index in step 2 would fail to build.
DELETE FROM "progresos" a
USING "progresos" b
WHERE a."jugador_id" = b."jugador_id"
  AND a."nivel_id" = b."nivel_id"
  AND (
    a."puntaje" < b."puntaje"
    OR (a."puntaje" = b."puntaje" AND a."id" < b."id")
  );

-- 2. With each (jugador, nivel) now holding a single row, enforce best-per-level as a
--    DB invariant. guardarLote upserts against this index inside its $transaction.
CREATE UNIQUE INDEX "progresos_jugador_id_nivel_id_key"
  ON "progresos" ("jugador_id", "nivel_id");
