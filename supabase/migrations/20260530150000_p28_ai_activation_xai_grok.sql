-- P28 patch: activate AI feature defaults for testing and add xAI Grok.
-- Secrets still belong in encrypted integration credentials or local env, never in source.

ALTER TABLE public.ai_feature_settings
  DROP CONSTRAINT IF EXISTS ai_feature_settings_feature_provider_check;

ALTER TABLE public.ai_feature_settings
  ADD CONSTRAINT ai_feature_settings_feature_provider_check CHECK (
    feature_key IN (
      'intake_assist',
      'property_legal_description_assist',
      'smart_search',
      'template_mapping_suggestions',
      'package_review',
      'missing_data_explanation',
      'activity_summary',
      'task_suggestions',
      'communication_drafts',
      'help_copilot'
    )
    AND provider_key IN (
      'disabled',
      'openai',
      'anthropic',
      'google_gemini',
      'google_vertex',
      'openrouter',
      'groq',
      'xai_grok'
    )
  );

INSERT INTO public.ai_feature_settings (
  tenant_id,
  feature_key,
  enabled,
  provider_key,
  model_key,
  max_output_tokens,
  monthly_budget_cents,
  require_expensive_model_confirmation,
  settings
)
VALUES
  (NULL, 'intake_assist', true, 'xai_grok', 'grok-fast-general', 1200, 5000, false, '{"activation": "testing"}'::jsonb),
  (NULL, 'property_legal_description_assist', true, 'xai_grok', 'grok-reasoning-general', 1400, 5000, false, '{"activation": "testing"}'::jsonb),
  (NULL, 'smart_search', true, 'groq', 'fast-search-helper', 800, 5000, false, '{"activation": "testing"}'::jsonb),
  (NULL, 'template_mapping_suggestions', true, 'xai_grok', 'grok-strong-mapping', 2000, 5000, true, '{"activation": "testing"}'::jsonb),
  (NULL, 'package_review', true, 'xai_grok', 'grok-strong-review', 1600, 5000, false, '{"activation": "testing"}'::jsonb),
  (NULL, 'missing_data_explanation', true, 'groq', 'fast-general', 700, 5000, false, '{"activation": "testing"}'::jsonb),
  (NULL, 'activity_summary', true, 'groq', 'fast-summary', 900, 5000, false, '{"activation": "testing"}'::jsonb),
  (NULL, 'task_suggestions', true, 'groq', 'fast-general', 800, 5000, false, '{"activation": "testing"}'::jsonb),
  (NULL, 'communication_drafts', true, 'xai_grok', 'grok-polished-writing', 1200, 5000, false, '{"activation": "testing"}'::jsonb),
  (NULL, 'help_copilot', true, 'groq', 'fast-general', 900, 5000, false, '{"activation": "testing"}'::jsonb)
ON CONFLICT (feature_key) WHERE tenant_id IS NULL
DO UPDATE SET
  enabled = EXCLUDED.enabled,
  provider_key = EXCLUDED.provider_key,
  model_key = EXCLUDED.model_key,
  max_output_tokens = EXCLUDED.max_output_tokens,
  monthly_budget_cents = EXCLUDED.monthly_budget_cents,
  require_expensive_model_confirmation = EXCLUDED.require_expensive_model_confirmation,
  settings = public.ai_feature_settings.settings || EXCLUDED.settings,
  updated_at = now();

COMMENT ON TABLE public.ai_feature_settings IS
  'Per-feature AI provider/model settings and budget guardrails. Defaults are active for testing, but credentials, cost controls, and human review remain required.';
