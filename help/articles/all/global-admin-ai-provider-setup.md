# Global Admin: AI Provider Setup

Use **AI Configuration** to save provider keys for the platform. The settings page is intentionally short: choose a provider, paste the key, optionally set a model override, and save.

## Supported provider options

- **xAI Grok** — current testing path for Grok keys.
- **Groq** — low-latency inference option for lightweight assistive workflows.
- **OpenAI** — direct OpenAI API path for drafting, summaries, mapping, and search assistance.
- **Anthropic** — direct Claude API path; useful for long-context review and mapping workflows.
- **Google Gemini Developer API** — direct Gemini key path for Google AI Studio credentials.
- **Google Vertex AI** — enterprise Google Cloud path using project and service account controls.
- **OpenRouter-compatible gateway** — gateway option for routing to multiple models behind one API shape.

## What the credential form does

1. Stores the key in encrypted server-side storage.
2. Shows only configured/not configured status after save.
3. Lets the admin test a saved key with the provider's model-list endpoint where available.
4. Never displays the saved key back in the browser.
5. Keeps AI outputs as suggestions that require human review.

## What it does not do yet

- It does not send documents for signature.
- It does not auto-change legal or transaction data.
- It does not approve template mappings.
- It does not send emails, Slack messages, or calendar events.

## Setup notes

Use the provider's own dashboard to create and rotate API keys. If a key is replaced in Choral Point, the new value becomes the active platform credential for future AI calls that use that provider.

After saving a key, use **Test saved key**. A passing test means the provider accepted the key and returned a model-list response. A failed test usually means the key is invalid, revoked, missing provider access, blocked by network policy, or the provider needs a service-account/OAuth validator instead of an API key validator.
