# jc-resume
personal resume / cv

The public site is only a login shell. The resume and other content live in a
**private Supabase Storage bucket** and are loaded after sign-in.

| File | Purpose |
|---|---|
| `login.html` | Animated sign-in (sonar pings, laser sweep, atom). Handles forgot-password and invite / reset links. |
| `portal.html` | Landing page after sign-in. Add new tools to the `APPS` list at the bottom. |
| `view.html?p=<path>` | Downloads `<path>` from the private bucket and renders it; rewrites its links to signed URLs. |
| `index.html` | Public stub: redirects to `view.html?p=index.html` (→ login if signed out). |
| `auth/config.js` | Supabase URL, anon key, `allowSignup`, `bucket`. |
| `auth/auth.js` | Shared helper: `SiteAuth.requireAuth()`, `SiteAuth.signOut()`. |
| `private/` | **Git-ignored.** Source of the private content; mirrored into the bucket. |
| `supabase/setup.sql` | Creates the private bucket + read policy for signed-in users. |
| `scripts/upload-private.mjs` | Uploads `private/` to the bucket. |

## One-time Supabase setup
1. **Project Settings → API**: URL + `anon` key go in `auth/config.js` (never the `service_role` key).
2. **SQL Editor**: run `supabase/setup.sql`.
3. **Authentication → Sign In / Providers → Email**: enabled; turn **off** "Allow new users to sign up" (invite-only).
4. **Authentication → URL Configuration**: Site URL = your site; add `<site>/login.html` to Redirect URLs
   (plus `http://localhost:3000/login.html` for local testing).
5. **Authentication → Users → Invite user** for each person.

## Updating content
Edit files in `private/`, then upload:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key>"   # or put it in a git-ignored .env
node scripts/upload-private.mjs            # --dry-run to preview
```

Paths are kept: `private/static/x.pdf` → `static/x.pdf` in the bucket.

### Adding a private page
Drop `private/my-tool.html` in, upload, and link to `view.html?p=my-tool.html` (e.g. from `APPS` in
`portal.html`). Inside private pages, use normal relative links: other `.html` pages open through the
viewer, images/PDFs/scripts get 6-hour signed URLs, and `portal.html`, `login.html`, `auth/*` and
`static/favicon64.png` resolve to the public site. Private pages can call `SiteAuth.signOut()`.

Test locally with `npx serve .` (Supabase auth doesn't work over `file://`).
