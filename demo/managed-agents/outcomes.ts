// Three features chained as rubric-graded Outcomes on one Managed Agents
// session. Each rubric is an explicit, independently-gradeable checklist —
// not vibes — so the grader's pass/fail is unambiguous. See run-demo.ts for
// how these are sent and chained.

export interface Outcome {
  name: string;
  description: string;
  rubric: string;
}

export const outcomes: Outcome[] = [
  {
    name: "Priority levels",
    description:
      "Add task priority levels to the TaskFlow API and Angular frontend. " +
      "Tasks get an optional priority field: 'low' | 'medium' | 'high', " +
      "defaulting to 'medium'. Support filtering tasks by priority. Commit " +
      "your work with a descriptive message when done — do not push yet.",
    rubric: `
- tasks.priority is added to the schema, constrained to 'low' | 'medium' | 'high', with a default of 'medium'
- POST /tasks accepts an optional priority; an invalid value (anything outside the three options) returns 400
- PATCH /tasks/:id can update priority; an invalid value returns 400
- GET /tasks?priority=high returns only high-priority tasks (and likewise for low/medium)
- The existing backend test suite (npm test in backend/) still passes
- New backend tests cover: invalid priority on create, invalid priority on update, and filtering by priority
- The Angular task-creation form includes a priority selector
- The Angular task board shows each task's priority and offers a way to filter the board by priority
- Work is committed to a new branch (not completed_tasks or main) with a descriptive commit message
`.trim(),
  },
  {
    name: "Due date filtering",
    description:
      "Add an optional due date to tasks, in ISO-8601 format, and support " +
      "filtering by overdue status and by a due-before cutoff. Handle " +
      "tasks with no due date gracefully everywhere. Commit your work " +
      "with a descriptive message when done — do not push yet.",
    rubric: `
- tasks.due_date is added to the schema as an optional ISO-8601 date/timestamp
- POST and PATCH /tasks accept an optional due_date; a malformed value returns 400
- GET /tasks?overdue=true returns only tasks with a due_date in the past that are not done, excluding tasks with no due_date
- GET /tasks?due_before=YYYY-MM-DD returns only tasks due before that date, excluding tasks with no due_date
- These filters compose correctly with the existing priority filter (e.g. ?priority=high&overdue=true)
- The existing backend test suite still passes
- New backend tests cover: invalid due_date, overdue filtering, due_before filtering, and tasks with no due date being excluded rather than erroring
- The Angular UI displays each task's due date when present, and provides a way to view/filter overdue tasks
- Tasks with no due date render cleanly in the UI (no "Invalid Date" or blank artifacts)
- Work is committed to the same branch with a descriptive commit message
`.trim(),
  },
  {
    name: "Tagging system",
    description:
      "Add a free-form tagging system for tasks, following the existing " +
      "cascade-delete schema pattern already used for projects and tasks. " +
      "Support adding, removing, and filtering by tag. When this feature's " +
      "rubric is fully met, push your branch to origin — this is the only " +
      "outcome in this session that should push.",
    rubric: `
- A tags table and a task_tags many-to-many join table are added, with cascade delete when a task is deleted (following the same ON DELETE CASCADE pattern already used elsewhere in the schema)
- POST /tasks/:id/tags adds a tag to a task (creating the tag if it doesn't already exist); a request for a nonexistent task returns 404
- DELETE /tasks/:id/tags/:tag removes a tag from a task; a request for a nonexistent task returns 404; removing a tag the task doesn't have is handled without error
- GET /tasks?tag=urgent returns only tasks with that tag
- The tag filter composes correctly with the existing priority and due-date filters
- The existing backend test suite still passes
- New backend tests cover: adding a tag, removing a tag, 404 on a nonexistent task, and filtering by tag
- The Angular UI lets a user add and remove tags on a task, and shows a way to filter the board by tag
- All work for this outcome and the two previous outcomes is committed
- The branch is pushed to origin (this is the only outcome where a push is expected)
`.trim(),
  },
];
