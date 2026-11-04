// OneRhythm — the double opt-in confirmation email.
//
// SHIPS DISABLED. With no configuration this function returns 503 and sends
// nothing. Enabling it is configuration, not new code: set the three secrets in
// README.md and deploy. That is deliberate — the landing page currently tells
// people plainly that "nothing is sent yet: we haven't set up our mail system",
// and that sentence must stay true until the mail system genuinely exists.
//
// WHY THIS EXISTS AT ALL
// ---------------------------------------------------------------------------
// The updates list is double opt-in: `confirmed_at is null` means NOT
// SUBSCRIBED, and nothing may ever be mailed to such a row. But there was no way
// to send the one message that lets someone confirm. Cloudflare Pages serves
// static files and the signup RPC is SQL — neither can send mail. So the flow had
// a missing middle, and the honest copy on the page was covering for it.
//
// THE ONE SECURITY PROPERTY THAT MATTERS
// ---------------------------------------------------------------------------
// The provider API key lives ONLY in a Supabase Edge Function secret. It is
// never in the client bundle, never in an EXPO_PUBLIC_* variable, and never in
// git. Anything prefixed EXPO_PUBLIC_ is compiled into the JavaScript every
// visitor downloads; putting a mail key there would let anyone on the internet
// send mail as onerhythm.org. .claude/hooks/secrets-pii-scan.sh was extended in
// this change to catch Resend/SendGrid/Mailgun key shapes and bare SMTP
// passwords, because it previously caught none of them.
//
// WHAT THIS FUNCTION DELIBERATELY DOES NOT DO
// ---------------------------------------------------------------------------
//   * It does not read, log, or return anything about the caller. No IP, no user
//     agent, no auth context. The marketing boundary (ADR 0011) forbids linking
//     a subscriber to a member, and a log line is a link.
//   * It does not accept a destination address from the caller. That would make
//     this an open relay: anyone could post an arbitrary address and have us mail
//     it. The address is looked up server-side from the token.
//   * It does not touch any member table. Not profiles, not auth.users.
//   * It does not report whether a token was valid. Same anti-enumeration
//     reasoning as subscribe_to_updates: a caller who does not hold the token
//     learns nothing from the response.
//   * It sends NO health content. The mail says what the project is and asks the
//     person to confirm. Nothing about arrhythmia, diagnosis, or symptoms —
//     mailing that to an unconfirmed address would be disclosing health-adjacent
//     data to someone who never asked for it.

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — this file runs on Deno in Supabase Edge Functions, not under the
// app's tsconfig. `npm run typecheck` covers the Expo client only; Deno globals
// (Deno.env, the URL-import serve) are not in that program. Excluded from
// tsconfig rather than pretended to typecheck.

const REQUIRED = ["RESEND_API_KEY", "MAIL_FROM", "SITE_URL"] as const;

/** Missing config is the DEFAULT state, and it must fail closed. */
function missingConfig(): string[] {
  return REQUIRED.filter((k) => {
    const v = Deno.env.get(k);
    return v === undefined || v.trim() === "";
  });
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // Fail closed, and say why in a way that helps an operator without telling a
  // stranger anything about the list.
  const missing = missingConfig();
  if (missing.length > 0) {
    console.error(
      `send-confirmation-email is not configured; missing: ${missing.join(", ")}`,
    );
    return json({ error: "not_configured" }, 503);
  }

  let token: unknown;
  try {
    ({ token } = await req.json());
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  // Tokens are 32 random bytes hex-encoded by subscribe_to_updates. Checking the
  // shape here avoids a pointless database round trip and is not an oracle: it
  // rejects on FORM, never on existence.
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
    return json({ ok: true }, 202);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Look the address up from the token, server-side. The caller never supplies a
  // destination — see the header. Only an unconfirmed, un-unsubscribed row is
  // eligible: re-sending to a confirmed address would be unsolicited mail, and
  // sending to an unsubscribed one would break the suppression promise.
  const lookup = await fetch(
    `${supabaseUrl}/rest/v1/updates_subscribers` +
      `?select=email&confirm_token=eq.${token}` +
      `&confirmed_at=is.null&unsubscribed_at=is.null`,
    {
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
      },
    },
  );

  if (!lookup.ok) {
    console.error(`subscriber lookup failed: ${lookup.status}`);
    return json({ error: "upstream" }, 502);
  }

  const rows = (await lookup.json()) as Array<{ email: string }>;

  // No eligible row: answer exactly as if one had been found. A caller who does
  // not hold a real token must not learn that.
  if (rows.length === 0) {
    return json({ ok: true }, 202);
  }

  const to = rows[0].email;
  const siteUrl = Deno.env.get("SITE_URL")!.replace(/\/+$/, "");
  const confirmUrl = `${siteUrl}/updates/confirm?token=${token}`;

  // Plain ~8th-grade, no hype, no urgency (CLAUDE.md voice). No health content.
  const text = [
    "Thanks for asking to hear about OneRhythm.",
    "",
    "Please confirm this is your address by opening this link:",
    confirmUrl,
    "",
    "If you didn't ask for this, you can ignore this email. We won't send",
    "anything else unless you confirm.",
    "",
    "OneRhythm is a peer-support community being built in the open. It is not",
    "medical advice and not an emergency service.",
    "",
    "— OneRhythm, an initiative of VT Infinite, Inc.",
  ].join("\n");

  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("MAIL_FROM"),
      to,
      subject: "Please confirm your email address",
      text,
    }),
  });

  if (!send.ok) {
    // Log the STATUS, never the body — a provider error body can echo the
    // destination address, and this function's logs must stay free of them.
    console.error(`mail send failed: ${send.status}`);
    return json({ error: "send_failed" }, 502);
  }

  return json({ ok: true }, 202);
});
