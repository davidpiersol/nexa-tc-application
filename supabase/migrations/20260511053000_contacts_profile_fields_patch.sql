-- P11 enhancement patch: expanded contact fields + category additions.

ALTER TYPE public.contact_category ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE public.contact_category ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE public.contact_category ADD VALUE IF NOT EXISTS 'seller';
ALTER TYPE public.contact_category ADD VALUE IF NOT EXISTS 'buyer';

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS salutation text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS suffix text,
  ADD COLUMN IF NOT EXISTS address_line_1 text,
  ADD COLUMN IF NOT EXISTS address_line_2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS other_category_description text;
