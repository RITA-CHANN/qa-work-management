# AI

Nothing AI-related is implemented yet. The AI layer is built in **Phase 8**; until an API key is configured,
everything runs on a deterministic **Mock provider** (`AI_PROVIDER=mock`).

The design is in [phases/phase-0-architecture.md §9](phases/phase-0-architecture.md#9-ai-architecture). Key rules that
every future AI feature must follow:

1. **No AI calls from the browser.** Frontend → backend endpoint → capability → provider adapter.
2. **Provider-agnostic.** Capabilities depend on an `AiProvider` interface; Anthropic, OpenAI and Mock are adapters.
3. **Structured output only.** Each capability has a Zod output schema; invalid output is rejected or repaired, never shown raw.
4. **Suggestions, not writes.** AI output is stored as an `AiSuggestion` and applied only after a human approves it.
   AI-created test cases start as `DRAFT` and need explicit human approval.
5. **FACT vs INFERENCE.** Every insight cites the records it is based on, or is labelled as inference with a confidence level.
   "Not enough data" is a valid answer.
6. **Provenance is visible.** Labels: _AI Generated_, _AI Suggested_, _Human Approved_.
