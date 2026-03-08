export const INTEGRATIONS = [
  {
    id: "gmail",
    name: "Gmail",
    description:
      "Send emails and read inbox context for AI-assisted email writing.",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description:
      "Access calendar events to schedule and draft meeting content.",
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description:
      "Read and write documents to use alongside your tone profiles.",
  },
  {
    id: "notion",
    name: "Notion",
    description:
      "Sync generated content directly to your Notion workspace.",
  },
  {
    id: "slack",
    name: "Slack",
    description:
      "Send AI-generated content and notifications to Slack channels.",
  },
] as const;

export type IntegrationId = (typeof INTEGRATIONS)[number]["id"];

export function getIntegration(id: string) {
  return INTEGRATIONS.find((i) => i.id === id) ?? null;
}
