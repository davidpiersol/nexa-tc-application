-- P31.1: Touch history includes text-message interactions from the sprint requirements.

ALTER TABLE public.crm_touchpoints
  DROP CONSTRAINT IF EXISTS crm_touchpoints_touch_type_check;

ALTER TABLE public.crm_touchpoints
  ADD CONSTRAINT crm_touchpoints_touch_type_check
  CHECK (touch_type IN ('note', 'call', 'email', 'text', 'meeting', 'task', 'import'));
