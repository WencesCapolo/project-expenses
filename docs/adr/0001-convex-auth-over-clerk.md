# Convex Auth (not Clerk) for authentication

**Status:** accepted

The app runs on Convex (reactive TypeScript backend + built-in file storage for bill/receipt attachments). The initial plan named Clerk for auth, but with ≤5 trusted internal users at a software factory, Clerk's value — prebuilt UI, org/user management, social login, scaling — is largely unused, while it adds an external dependency, a second dashboard, and another integration surface.

We chose **Convex Auth** instead: authentication lives inside the same Convex system as the data and files, keeping the stack to one service with no third-party identity provider.

## Considered Options

- **Clerk** — mature, polished prebuilt auth UI, first-class Convex integration, free tier covers 5 users. Rejected as more than needed: its org-management and polish aren't exercised by a 5-user internal tool, and it adds a dependency.
- **Convex Auth** — auth built into Convex; one system, no external service, no extra bill. Less polished UI, more assembly required. Chosen for simplicity and single-system cohesion.

## Consequences

- We assemble more of the sign-in/sign-up UI ourselves rather than dropping in Clerk components.
- If the user base later grows well beyond a handful or needs org/multi-tenant features, revisiting Clerk (or another IdP) is on the table — this decision is scoped to the small-internal-tool reality.
