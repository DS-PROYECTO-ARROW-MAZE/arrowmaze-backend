-- 3D board geometry (ticket 19): add the depth axis ("capa"/z) to Nivel/CeldaNivel.
--
-- Purely additive: both new columns declare a DEFAULT, so every existing row is already a
-- valid single-layer (profundo=1) 3D board the moment this migration lands — no backfill
-- script is needed, and no existing data is read, copied, or deleted.

ALTER TABLE "niveles" ADD COLUMN "profundo" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "celdas_nivel" ADD COLUMN "z" INTEGER NOT NULL DEFAULT 0;
