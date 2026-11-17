# Brillare Scholars

Buildless, responsive website. Serve this directory over HTTP; no build required.

## Pages

Home, Our Services, About, The Team, Enroll Now, Log In, password reset, and Student Portal. Shared square-edge design, accessible navigation, original architectural SVG, and the supplied Join Us Google Form link.

## Account setup — required before launch

The existing repository had no authentication backend. This branch includes a Supabase integration, **not an active account service**. Until configured, forms stay disabled and visitors have a working link to the original Wix portal. No fake local login or browser-stored passwords are used.

1. Create/select a Supabase project and enable email/password authentication with email confirmation enabled. Configure appropriate password rules, rate limits and production email delivery.
2. Run `supabase/schema.sql`, then `supabase/announcements.sql`, then `supabase/seed-portal.sql`. For an existing installation, run only the announcements migration and seed. The seed is repeatable and preserves existing lesson links and edited rows. It enables row-level security: anonymous visitors cannot read lessons, signed-in students can read published lessons, and browser clients cannot write lessons.
3. Put only the project's URL and **publishable** (or legacy anon) key in `auth-config.js`. Never put a service-role/secret key in the repository.
4. Set the production Site URL in Supabase Auth and allow the exact deployed `student-portal.html` and `reset-password.html` redirect URLs (including the repo path when using GitHub Pages). Add explicit development URLs separately.
5. The seed contains the screenshot-verified four core modules, four named bonus modules, two upcoming bonus modules, and five dated announcements. All lesson URLs remain NULL as requested. Set URLs in the dashboard when ready.
6. Test signup, email confirmation, login, recovery, expired sessions, logout, and anonymous database access against the configured project before merging/deploying.

The portal now reproduces the supplied original content and three destinations (Core Curriculum, Bonus Modules, Announcements), restyled with square cards, architectural lines, and a light palette. Dates in announcements are historical dates from the screenshots. No course files or lesson destinations are fabricated. Existing Wix accounts do not automatically become Supabase accounts. Decide whether to migrate accounts or keep Wix authentication before launch; this implementation does not claim shared Wix sessions.

Lesson links pointing to external public files are not themselves protected by portal login. Use private storage with signed access if lesson-file confidentiality is required.

## Validation

`node --test tests/site.test.mjs` checks links, configuration guardrails, auth and portal behavior with a fake provider (never real student accounts), and database policy requirements. Backend integration still requires the live checks above.

Preserved content: program descriptions, mission, team members and photos, contact and existing legal links. `architecture.svg` is original vector artwork.
