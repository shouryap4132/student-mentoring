-- add-missing-columns.sql
-- Run this in the Supabase SQL editor if you get 400 errors on profile saves.
-- Adds columns that exist in the app code but were missing from the original schema.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url       text,
  ADD COLUMN IF NOT EXISTS knowledge_level  text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS roles            text[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grade_level      text,
  ADD COLUMN IF NOT EXISTS subjects         text[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio              text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS qualifications   text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS availability     text         NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_complete boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_hours       integer      NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS avg_rating       numeric(3,2) NOT NULL DEFAULT 5.00;

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at  timestamptz;
