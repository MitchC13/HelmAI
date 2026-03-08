import Anthropic from "@anthropic-ai/sdk";

// Server-only singleton. Never import this in client components.
// Reads ANTHROPIC_API_KEY from the environment automatically.
export const anthropic = new Anthropic();
