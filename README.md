# Brillare Scholars

Buildless, responsive website. Serve this directory over HTTP; no build required.

## Pages

Home, Our Services, About, The Team, Enroll Now, Log In, password reset, and Student Portal. Shared square-edge design, accessible navigation, original architectural SVG, and the supplied Join Us Google Form link.

## Account setup — required before launch

The existing repository had no authentication backend. This branch includes a Supabase integration, **not an active account service**. Until configured, forms stay disabled and visitors have a working link to the original Wix portal. No fake local login or browser-stored passwords are used.

1. Create/select a Supabase project and enable email/password authentication with email confirmation enabled. Configure appropriate password rules, rate limits and production email delivery.
2. Run `supabase/schema.sql` once. It enables row-level security: anonymous visitors cannot read lessons, signed-in students can read published lessons, and browser clients cannot write lessons.
3. Put only the project's URL and **publishable** (or legacy anon) key in `auth-config.js`. Never put a service-role/secret key in the repository.
4. Set the production Site URL in Supabase Auth and allow the exact deployed `student-portal.html` and `reset-password.html` redirect URLs (including the repo path when using GitHub Pages). Add explicit development URLs separately.
5. Add the original portal curriculum to the `lessons` table after it has been reviewed. Fields: title, description, category (`core`/`bonus`), position, lesson_url, published. Links may remain NULL; those rows show “Coming soon”. Private course data is fetched only after login and is protected by database RLS, not by hiding HTML.
6. Test signup, email confirmation, login, recovery, expired sessions, logout, and anonymous database access against the configured project before merging/deploying.

The original portal is behind a Wix login, so its private layout and curriculum have **not** been copied or verified. This branch provides a proposed portal shell, search, category filtering and protected data access. Existing Wix accounts do not automatically become Supabase accounts. Decide whether to migrate accounts or keep Wix authentication before launch; this implementation does not claim shared Wix sessions.

Lesson links pointing to external public files are not themselves protected by portal login. Use private storage with signed access if lesson-file confidentiality is required.

## Validation

`node --test tests/site.test.mjs` checks links, configuration guardrails, auth and portal behavior with a fake provider (never real student accounts), and database policy requirements. Backend integration still requires the live checks above.

Preserved content: program descriptions, mission, team members and photos, contact and existing legal links. `architecture.svg` is original vector artwork.
