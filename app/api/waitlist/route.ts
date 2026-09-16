import { launch } from "@/lib/store-config";

// Closed on both client and server until the controller, retention, consent
// record, double opt-in, unsubscribe, rate limiting and mail provider are ready.
export async function POST() {
  if (!launch.waitlistEnabled) return Response.json(
    { error: "Early access registration is not open yet. No email has been stored." },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
  return Response.json({ error: "Registration setup is incomplete." }, { status: 503 });
}
