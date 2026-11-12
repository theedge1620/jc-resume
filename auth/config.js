/* ------------------------------------------------------------------
   Supabase connection settings.
   Supabase → Project Settings → API:
     url     = "Project URL"
     anonKey = "anon / public" key  (safe to publish; NEVER put the
               service_role key here)
------------------------------------------------------------------ */
window.SITE_AUTH = {
  url:     'https://azyvjnajzabkcinipmvn.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6eXZqbmFqemFia2NpbmlwbXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NDc0MzAsImV4cCI6MjExMDAyMzQzMH0.6-Q2dOOP36TKa5Ikr3WMTgRW4GPvC1Bu_l8l0OUXywY',

  /* false = invite-only. Accounts are created in the Supabase dashboard
     (Authentication → Users → Invite user). If you set this to true,
     also enable "Allow new users to sign up" in Supabase. */
  allowSignup: false,

  /* Private Storage bucket that holds the site content (see supabase/setup.sql). */
  bucket: 'private-site',
};
