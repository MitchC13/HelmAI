export const AGENT_TYPES = [
  {
    slug: "copywriter",
    name: "Copywriter",
    description:
      "Generate compelling copy for websites, landing pages, and campaigns.",
  },
  {
    slug: "content-strategist",
    name: "Content Strategist",
    description:
      "Plan and structure content strategies aligned to your brand voice.",
  },
  {
    slug: "ad-creative",
    name: "Ad Creative",
    description: "Craft ad headlines, hooks, and creative briefs at scale.",
  },
  {
    slug: "email-assistant",
    name: "Email Assistant",
    description:
      "Write and refine email campaigns, sequences, and one-off messages.",
  },
  {
    slug: "automation-builder",
    name: "Automation Builder",
    description:
      "Design workflow automation logic and trigger-based messaging.",
  },
  {
    slug: "calendar-brief",
    name: "Calendar Brief",
    description:
      "AI-generated briefs, summaries, and follow-ups from calendar events.",
  },
] as const;

export type AgentSlug = (typeof AGENT_TYPES)[number]["slug"];

export function getAgent(slug: string) {
  return AGENT_TYPES.find((a) => a.slug === slug) ?? null;
}
