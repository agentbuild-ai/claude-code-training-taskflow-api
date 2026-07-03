// One-time setup: creates a reusable Anthropic Environment + Agent for the
// TaskFlow Managed Agents demo. Run once (`npm run setup`), then copy the
// printed IDs into .env. Do not call this per demo run — see run-demo.ts.
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a senior full-stack engineer working in the TaskFlow demo repository.

The repo is split into two independent apps:
- backend/  — Express 4 + TypeScript 5 + better-sqlite3 REST API
- frontend/ — Angular 18 (standalone components) + Tailwind CSS

Before making any changes, read backend/CLAUDE.md and frontend/CLAUDE.md in
full and follow the conventions documented there — in particular:
- the split entry point (app.ts vs server.ts) and the single shared
  better-sqlite3 instance in backend/src/db.ts
- one Express router per resource, with the existing next(err) error
  convention (never throw or write ad hoc res.status().json() errors)
- Angular services own both HTTP calls and signal-based state; components
  never call HttpClient directly; errors surface via each service's
  .error() signal; cross-resource lookups use computed()

Branch discipline: create a new branch for your work. Never commit directly
to completed_tasks or main.

Definition of done includes tests: run the backend test suite (npm test
inside backend/) and confirm it passes before considering any task met.

No pull-request tooling is configured for this session — there is no GitHub
MCP server and no PR-creation credential. Do not attempt to open a pull
request. Pushing your branch (only when explicitly asked to) is the full
scope of any git-remote action available to you.`;

async function main() {
  const environment = await client.beta.environments.create({
    name: `taskflow-api-demo-env-${Date.now()}`,
    config: { type: "cloud", networking: { type: "unrestricted" } },
  });

  const agent = await client.beta.agents.create({
    name: "TaskFlow Feature Builder",
    model: "claude-opus-4-8",
    system: SYSTEM_PROMPT,
    tools: [{ type: "agent_toolset_20260401" }],
  });

  console.log("Setup complete. Add these to demo/managed-agents/.env:\n");
  console.log(`ENVIRONMENT_ID=${environment.id}`);
  console.log(`AGENT_ID=${agent.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
