import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ANMELDE_MARKER, ANMELDE_MARKER_OPTIONEN } from "@/lib/anmelde-marker";

/**
 * Erneuert abgelaufene Login-Sitzungen, bevor Seiten gerendert werden.
 * Ohne Supabase-Cookie (anonyme Besucher) passiert nichts – keine Verzögerung, keine Cookies.
 */
export async function proxy(request: NextRequest) {
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
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
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  // Sitzungen von vor der Einführung des Hinweis-Cookies nachrüsten, damit der Header sie erkennt.
  if (data?.claims?.sub && !request.cookies.has(ANMELDE_MARKER)) {
    response.cookies.set(ANMELDE_MARKER, "1", ANMELDE_MARKER_OPTIONEN);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/ical|icon.svg|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
