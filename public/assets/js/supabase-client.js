/**
 * Skep 'n enkele gedeelde Supabase-kliënt (of null in demo-modus).
 * Word deur main.js en admin.js gebruik.
 *
 * Die supabase-js biblioteek word in die HTML ingelaai via 'n <script>-merker
 * vanaf 'n CDN, en is beskikbaar as die globale `supabase`.
 */
window.getSupabaseClient = (function () {
  let client = null;
  return function () {
    if (!window.isSupabaseConfigured()) return null;
    if (client) return client;
    if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
      console.warn("supabase-js is nie ingelaai nie.");
      return null;
    }
    client = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
    return client;
  };
})();
