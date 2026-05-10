# Choral Point AI Provider, Cost, and Wiring Guide

The AI layer should not rely on only Anthropic. Choral Point should support multiple providers and let an admin choose provider/model by feature.

## Provider Strategy

Support three paths:

1. Direct provider integrations
   - OpenAI
   - Anthropic
   - Google Gemini Developer API / Vertex AI
   - Future direct providers

2. Aggregator/gateway integration
   - OpenRouter-compatible API or similar gateway
   - Useful for trying many models with one API shape
   - Still requires careful data/privacy and model-routing review

3. Disabled/no-AI mode
   - All core workflows must still work without AI
   - AI should improve speed and review quality, not become a hard dependency

## Recommended Product Configuration

Do not set one global model for everything. Use per-feature settings:

```text
AI Feature                 Default Cost Tier     Example Model Class
Intake assist              low/medium            fast/cheap general model
Legal description assist   medium                stronger reasoning model
Smart search               low                   embedding/search or cheap model
PDF field mapping          medium/high           stronger reasoning/vision-capable model if needed
Package completeness       medium                strong reasoning model
Activity summary           low                   fast summarization model
Task suggestions           low                   fast general model
Message drafts             medium                polished writing model
Help/copilot               low/medium            fast general model
```

Admin controls:

- Enable/disable AI globally
- Enable/disable AI per feature
- Select provider/model per feature
- Monthly tenant budget cap
- Per-request max token cap
- Require confirmation for expensive models
- Allow user-provided API keys later if needed

## Cost Basics

Most major model APIs bill by tokens:

```text
estimated_cost =
  (input_tokens / 1,000,000 * input_price_per_1m)
  +
  (output_tokens / 1,000,000 * output_price_per_1m)
  +
  tool_or_search_costs
```

Important cost drivers:

- Output tokens usually cost more than input tokens.
- Long prompts and full document text can get expensive quickly.
- Tool calls, web search, grounding, image/PDF processing, and code execution can add extra charges.
- Cached input can be cheaper if provider supports prompt caching.
- Batch APIs can be cheaper for non-urgent jobs.
- Pricing changes often, so store pricing as configurable metadata, not hard-coded constants buried in code.

## Current Pricing Signals Checked

As of this planning pass on May 10, 2026:

- OpenAI publishes per-1M-token prices by model and notes Batch API discounts and tool costs on its API pricing page.
- Anthropic publishes per-1M-token Claude pricing, cache pricing, Batch API discounts, long-context pricing, and tool/search charges.
- Google publishes Gemini/Vertex AI pay-as-you-go pricing; Google notes billing is token-based and that grounding/tools may have separate request charges.
- OpenRouter publishes model pricing and can expose many models behind one API, but the product still needs provider/model governance and data-policy review.

Always re-check prices before launch or before enabling expensive features.

## Suggested Data Model

Add or extend integration/config tables to support:

```text
ai_providers
  id
  provider_key              openai | anthropic | google_gemini | google_vertex | openrouter | custom
  display_name
  enabled
  auth_mode                 api_key | oauth | service_account | gateway_key
  encrypted_credentials
  settings_json

ai_models
  id
  provider_id
  model_key
  display_name
  capability_json           text, vision, pdf, json_mode, tools, embeddings
  input_price_per_1m
  output_price_per_1m
  cached_input_price_per_1m
  pricing_source_url
  pricing_checked_at
  enabled

ai_feature_settings
  id
  feature_key               intake_assist | template_mapping | package_review | etc.
  provider_id
  model_id
  enabled
  max_input_tokens
  max_output_tokens
  require_confirmation
  monthly_budget_cents

ai_usage_events
  id
  tenant_id
  user_id
  feature_key
  provider_key
  model_key
  related_transaction_id
  related_template_id
  input_tokens
  output_tokens
  cached_input_tokens
  tool_usage_json
  estimated_cost_cents
  provider_request_id
  status
  error_message
  created_at
```

If the current app prefers the existing `api_integrations` table, the first implementation can reuse it for encrypted provider credentials and add the model/feature/usage tables separately.

## Wiring Pattern

Use a provider-neutral interface:

```ts
type AiFeatureKey =
  | "intake_assist"
  | "legal_description_assist"
  | "smart_search"
  | "template_mapping"
  | "missing_data_explanation"
  | "package_review"
  | "activity_summary"
  | "task_suggestions"
  | "message_draft"
  | "help_copilot";

type AiRequest = {
  feature: AiFeatureKey;
  tenantId: string;
  userId: string;
  transactionId?: string;
  templateId?: string;
  input: unknown;
  responseFormat?: "text" | "json";
};

type AiResponse<T = unknown> = {
  output: T;
  provider: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
    estimatedCostCents?: number;
  };
};
```

Adapter shape:

```ts
interface AiProviderAdapter {
  complete<T>(request: AiRequest, modelConfig: AiModelConfig): Promise<AiResponse<T>>;
}
```

Provider adapters:

- `OpenAiAdapter`
- `AnthropicAdapter`
- `GoogleGeminiAdapter`
- `GoogleVertexAdapter`
- `OpenRouterAdapter`
- `MockAiAdapter` for tests/local development

## Cost Controls

Minimum viable controls:

- Log every AI call.
- Estimate cost before and after each call.
- Reject calls when a tenant monthly cap is exceeded.
- Limit input size and output tokens by feature.
- Require explicit confirmation for high-cost features such as large PDF/template mapping.
- Prefer cheaper models for summaries, task suggestions, and search help.
- Use stronger models only for high-value reasoning or mapping.

## Recommended Rollout

1. Add provider-neutral schema and `MockAiAdapter`.
2. Add OpenAI + Anthropic direct adapters.
3. Add Google Gemini direct adapter.
4. Add OpenRouter-compatible gateway adapter.
5. Add admin UI for provider credentials and model choices.
6. Add usage dashboard showing cost by feature/provider/model.
7. Enable features one at a time, starting with low-risk suggestions:
   - activity summary
   - task suggestions
   - missing-data explanations
   - template mapping suggestions

Do not enable AI to send documents, approve mappings, or alter legal transaction data automatically.

## Sources

- [OpenAI API pricing](https://openai.com/api/pricing/)
- [OpenAI platform pricing](https://platform.openai.com/docs/pricing/)
- [Anthropic Claude pricing](https://docs.claude.com/en/docs/about-claude/pricing)
- [Google Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- [OpenRouter pricing](https://openrouter.ai/pricing)

