/* ------------------------------------------------------------------
   Shared auth helper. Load after the Supabase UMD bundle and config.js:

     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
     <script src="auth/config.js"></script>
     <script src="auth/auth.js"></script>
     <script>SiteAuth.requireAuth()</script>   ← on any protected page

   requireAuth() hides the page until a session is confirmed, otherwise
   sends the visitor to login.html?next=<this page>.
------------------------------------------------------------------ */
(function () {
  const cfg = window.SITE_AUTH || {};
  const configured = !!(cfg.url && cfg.anonKey &&
    !/YOUR-/.test(cfg.url) && !/YOUR-/.test(cfg.anonKey));

  // Site root = the folder above /auth/, so links work from any page depth
  // and under a GitHub Pages project path (/jc-resume/).
  const root   = new URL('..', document.currentScript.src);
  const LOGIN  = new URL('login.html', root).href;
  const PORTAL = new URL('portal.html', root).href;

  const client = configured && window.supabase
    ? window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

  const style = document.createElement('style');
  style.textContent = 'html.auth-pending body{visibility:hidden}';
  document.head.appendChild(style);

  function loginUrl() {
    const here = location.pathname + location.search + location.hash;
    return LOGIN + '?next=' + encodeURIComponent(here);
  }

  /** Only allow same-origin redirect targets (blocks open redirects). */
  function safeNext(raw) {
    if (!raw) return PORTAL;
    try {
      const u = new URL(raw, location.origin);
      return u.origin === location.origin ? u.href : PORTAL;
    } catch { return PORTAL; }
  }

  async function getUser() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session ? data.session.user : null;
  }

  async function requireAuth() {
    document.documentElement.classList.add('auth-pending');
    const user = await getUser();
    if (!user) { location.replace(loginUrl()); return null; }
    document.documentElement.classList.remove('auth-pending');
    // Signed out in another tab → leave this one too.
    client.auth.onAuthStateChange((evt) => {
      if (evt === 'SIGNED_OUT') location.replace(loginUrl());
    });
    return user;
  }

  async function signOut() {
    if (client) await client.auth.signOut();
    location.replace(LOGIN);
  }

  window.SiteAuth = { client, configured, config: cfg, LOGIN, PORTAL,
                      requireAuth, getUser, signOut, safeNext };
})();
