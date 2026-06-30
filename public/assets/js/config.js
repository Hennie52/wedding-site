/**
 * SUPABASE-INSTELLINGS
 * ---------------------------------------------------------------------------
 * Vul hierdie twee waardes in NÁ jy jou Supabase-projek geskep het.
 * (Sien docs/01-SUPABASE-OPSTELLING.md vir stap-vir-stap instruksies.)
 *
 * Hierdie waardes is VEILIG om in die kode te hê — die "anon"-sleutel is
 * spesifiek ontwerp om in die blaaier gebruik te word. Die databasis word
 * beskerm deur reëls (RLS) aan Supabase se kant.
 *
 * Solank dit leeg is, loop die werf in "demo-modus": alle teks wys, maar
 * RSVP's word nie gestoor nie (jy kan dus die voorkoms toets sonder Supabase).
 */
window.SUPABASE_CONFIG = {
  url: "https://eofkspwdgxqwyxetslok.supabase.co", // bv. "https://eofkspwdgxqwyxetslok.supabase.co"
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZmtzcHdkZ3hxd3l4ZXRzbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4Mjg3NTYsImV4cCI6MjA5ODQwNDc1Nn0.S3fiikWjZ2-lr89H3MSY_JQRbDROpuuDo_5ci5cKFRM", // die lang "anon public" sleutel
};

// Hulpfunksie: is Supabase reg opgestel?
window.isSupabaseConfigured = function () {
  return Boolean(
    window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey
  );
};
