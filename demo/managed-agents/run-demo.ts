// Live demo runner: creates one Managed Agents session against this repo's
// GitHub remote and chains the three outcomes in outcomes.ts on it, printing
// progress to the terminal. Each run creates a fresh session, so this is
// safe to re-run. See README.md for prerequisites.
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { outcomes } from "./outcomes.js";

const REPO_URL = "https://github.com/agentbuild-ai/claude-code-training-taskflow-api";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error("Copy .env.example to .env and fill it in (see README.md).");
    process.exit(1);
  }
  return value;
}

const ANTHROPIC_API_KEY = requireEnv("ANTHROPIC_API_KEY");
const AGENT_ID = requireEnv("AGENT_ID");
const ENVIRONMENT_ID = requireEnv("ENVIRONMENT_ID");
const GITHUB_TOKEN = requireEnv("GITHUB_TOKEN");
const BASE_BRANCH = process.env.BASE_BRANCH ?? "completed_tasks";

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

type TerminalResult = "satisfied" | "max_iterations_reached" | "failed" | "interrupted";

async function main() {
  console.log(`Creating session (base branch: ${BASE_BRANCH})...`);

  const session = await client.beta.sessions.create({
    agent: AGENT_ID,
    environment_id: ENVIRONMENT_ID,
    title: `TaskFlow demo — ${new Date().toISOString()}`,
    resources: [
      {
        type: "github_repository",
        url: REPO_URL,
        authorization_token: GITHUB_TOKEN,
        mount_path: "/workspace/taskflow-api",
        checkout: { type: "branch", name: BASE_BRANCH },
      },
    ],
  });

  console.log(`\nSession created: ${session.id}`);
  console.log(`Watch it live: https://platform.claude.com/workspaces/default/sessions/${session.id}\n`);

  const stream = await client.beta.sessions.events.stream(session.id);

  let outcomeIndex = 0;
  let currentOutcomeId: string | null = null;
  let allOutcomesDone = false;

  async function sendOutcome(i: number) {
    currentOutcomeId = null;
    const outcome = outcomes[i];
    console.log(`\n=== Outcome ${i + 1}/${outcomes.length}: ${outcome.name} ===\n`);
    await client.beta.sessions.events.send(session.id, {
      events: [
        {
          type: "user.define_outcome",
          description: outcome.description,
          rubric: { type: "text", content: outcome.rubric },
          max_iterations: 5,
        },
      ],
    });
  }

  await sendOutcome(0);

  for await (const event of stream) {
    switch (event.type) {
      case "user.define_outcome": {
        // Echoed back with a server-assigned outcome_id.
        if (currentOutcomeId === null && "outcome_id" in event) {
          currentOutcomeId = (event as { outcome_id: string }).outcome_id;
        }
        break;
      }

      case "agent.message": {
        for (const block of event.content) {
          if (block.type === "text") {
            process.stdout.write(block.text);
          }
        }
        break;
      }

      case "span.outcome_evaluation_start":
      case "span.outcome_evaluation_ongoing": {
        if (currentOutcomeId === null) {
          currentOutcomeId = event.outcome_id;
        }
        break;
      }

      case "span.outcome_evaluation_end": {
        if (currentOutcomeId === null) {
          currentOutcomeId = event.outcome_id;
        }
        if (event.outcome_id !== currentOutcomeId) break;

        if (event.result === "needs_revision") {
          console.log(`\n[iteration ${event.iteration}: needs_revision — continuing]\n`);
          break;
        }

        const result = event.result as TerminalResult;
        console.log(`\n>>> Outcome ${outcomeIndex + 1} (${outcomes[outcomeIndex].name}) result: ${result}`);
        if (event.explanation) console.log(event.explanation);

        outcomeIndex += 1;
        if (outcomeIndex < outcomes.length) {
          await sendOutcome(outcomeIndex);
        } else {
          allOutcomesDone = true;
        }
        break;
      }

      case "session.error": {
        console.error("\n[session.error]", event);
        break;
      }

      case "session.status_terminated": {
        allOutcomesDone = true;
        break;
      }

      default:
        break;
    }

    if (
      allOutcomesDone &&
      (event.type === "session.status_terminated" ||
        (event.type === "session.status_idle" &&
          (event as { stop_reason?: { type?: string } }).stop_reason?.type !== "requires_action"))
    ) {
      break;
    }
  }

  console.log("\nAll outcomes finished.");
  console.log("Next steps to show the diff:");
  console.log("  git fetch origin");
  console.log("  git branch -r --sort=-committerdate | head -5   # find the agent's branch");
  console.log("  git log origin/<branch-name>                    # inspect its commits");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
