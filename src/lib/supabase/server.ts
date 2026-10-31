import { createServerClient } from "@supabase/ssr";
import { io } from "next/cache";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/** Supabase-Client mit der Sitzung des angemeldeten Veranstalters (RLS greift). */
export async function createSessionClient() {
  const cookieStore = await cookies();
  // Supabase prüft Ablaufzeiten mit Date.now() – das darf erst zur Anfragezeit passieren,
  // auch beim Neu-Rendern nach einer Server-Action (sonst meldet Next „blocking-prerender-current-time“).
  await io();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Nur der Server liest die Sitzung (kein Supabase im Browser) – daher httpOnly.
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
          } catch {
            // In Server Components dürfen keine Cookies gesetzt werden – das erledigt der Proxy.
          }
        },
      },
    },
  );
}
