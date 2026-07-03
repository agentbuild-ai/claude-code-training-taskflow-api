# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in `frontend/`. It supplements the root `CLAUDE.md`, which covers the Express API this UI talks to.

## Project overview

Angular 18 single-page app (standalone components, no `NgModule`s) for the TaskFlow API — lists/creates users and projects, and manages tasks on a to-do / in-progress / done board. Styled with Tailwind CSS utility classes directly in templates; no component-scoped CSS files are used.

## Commands

```bash
npm install            # from within frontend/
npx ng serve           # dev server on http://localhost:4200, proxies nothing — calls the API directly
npx ng build           # production build to frontend/dist/frontend
npx ng test            # Karma/Jasmine unit tests
```

The API must be running separately (`npm run dev` from the repo root, port 3000) — see the root `CLAUDE.md`.

## Architecture

- **API base URL** is the single constant `API_BASE_URL` in `src/app/services/api-config.ts`. Change it there, not per-service, if the API moves. Cross-origin calls work because the Express app enables CORS (`src/app.ts` at the repo root).
- **One service per resource** (`UsersService`, `ProjectsService`, `TasksService` in `src/app/services/`), each combining the HTTP calls *and* the state for that resource as a writable `signal`. There is no separate state-management library and no `NgRx`-style store — components read a service's signal directly in the template (e.g. `usersService.users()`) rather than subscribing to an `Observable`.
- **Components are consumers, not fetchers.** Each component (`user-list`, `project-list`, `task-board` in `src/app/components/`) injects the services it needs, calls `.load()` in `ngOnInit`, and calls service methods (`.create()`, `.updateStatus()`, `.remove()`) in response to user actions. Components never call `HttpClient` directly — if a new piece of UI needs data, add or extend a service method rather than injecting `HttpClient` in the component.
- **Error handling convention**: every service method pipes through a private `handleError` that writes the API's `{ error: message }` body into that service's `error` signal and swallows the error (via `catchError(() => of(null))`) so one failed request doesn't break the whole component. Templates read `<service>.error()` to show a message. Follow this pattern for new service methods rather than throwing or handling errors ad hoc in the component.
- **Models** in `src/app/models/` are hand-kept in sync with the backend's `src/types.ts` — there is no code generation between the two. When a backend field or endpoint shape changes, update the matching model here.
- **Cross-resource lookups** (e.g. showing a task's project name or a project's owner name) are done client-side with a `computed()` signal that builds an ID→name `Map` from another service's already-loaded signal (see `projectNameById` in `task-board.component.ts`) — not via a second API call per row.
