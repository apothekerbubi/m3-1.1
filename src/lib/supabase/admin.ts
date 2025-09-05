// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

// Fester Admin-Client, der mit dem Service-Role-Key authentifiziert ist.
// Nur auf dem Server verwenden!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Optionale Factory, falls eine neue Instanz benötigt wird
export function createAdminClient() {
  return supabaseAdmin;
}
