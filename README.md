# Fable Together

Fable Together is a storytelling application combining story creation, narration, voice tools, quests, and a shared story library.

This repository is a sanitized demo adaptation of the original application. The current baseline preserves the existing product implementation while paid and production service dependencies are converted to deterministic demo services in subsequent development.

## Application modes

Demo Mode is enabled with `NEXT_PUBLIC_DEMO_MODE=true` and is also the safe default when Supabase public credentials are absent. It supplies a deterministic user, profile, library counts, credits, quests, voices, search results, and notifications without contacting production services.

Existing pages consume typed application services from `src/lib/services`. Client identity and profile access switch between demo and production implementations there. Existing API routes provide the server boundary and select deterministic demo responses before reaching Supabase, ElevenLabs, or translation providers. Features whose demo implementation belongs to a later iteration return an explicit, truthful Demo Mode response.

## Provenance

- Project: Fable Together
- Source branch: `mvp-beta`
- Source commit: `5c4b0d9`
- Source context: December 2025
- This repository begins the sanitized public-demo adaptation. The original private repository remains the historical record.
