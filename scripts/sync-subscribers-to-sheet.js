#!/usr/bin/env node
// Mirror the updates list into a private Google Sheet, for founder visibility.
//
//   npm run sync:subscribers
//
// This is a LOCAL, ON-DEMAND script, not infrastructure. There is no hosted
// Supabase project and no edge runtime yet, and this deliberately does not
// become a cron, a webhook, or a server.
//
// ===========================================================================
// THE RULES THIS SCRIPT EXISTS UNDER (ADR 0011)
// ===========================================================================
// 1. FULL-REFRESH OVERWRITE of one tab. NEVER append.
//    This is the rule that keeps the mirror from breaking deletion rights. An
//    append-only mirror becomes an undeletable shadow copy: a row deleted or
//    unsubscribed in the database would live on in the sheet forever, and the
//    unsubscribe that CAN-SPAM requires would be quietly undone by the next
//    sync. Overwriting means deletions and unsubscribes propagate, and the
//    database stays the only system of record. This file makes no call to the
//    Sheets append endpoint, and a test asserts it never will.
// 2. ONE-WAY, database -> sheet. Nothing is ever read back from the sheet or
//    written to the database here. This script performs no writes to Postgres
//    at all.
// 3. MARKETING FIELDS ONLY, from scripts/subscriber-export-fields.json. The
//    no-correlation rule extends to the mirror: this may never carry a member
//    or profile field, and it does not carry the tokens either — an
//    unsubscribe token in a spreadsheet is a live capability sitting in a
//    document.
// 4. CREDENTIALS are a service-account JSON at a gitignored path, named by an
//    env var, server/local only. Never in the client bundle, and never in an
//    EXPO_PUBLIC_* variable — anything with that prefix is compiled into the
//    app by Expo and would ship to every visitor. The script refuses to read
//    a credential from such a variable.
// 5. The sheet is a private document on the founder's Workspace. It must NOT
//    be link-shared publicly. Recorded as a subprocessor in
//    docs/privacy/marketing-list-inventory.md.
//
// No new npm dependency: the service-account JWT is signed with node's own
// crypto and the two APIs are called with fetch. Adding a large SDK to reach
// two REST endpoints would enlarge the audit surface of a project whose whole
// posture is to keep it small.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const FIELDS = JSON.parse(
  fs.readFileSync(path.join(__dirname, "subscriber-export-fields.json"), "utf8"),
);

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function loadEnvFile(file) {
  try {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* fall back to the ambient environment */
  }
}

function required(name) {
  // Rule 4, enforced rather than documented: a credential must never be read
  // from an EXPO_PUBLIC_* variable, because Expo inlines those into the client
  // bundle and it would ship to every visitor of the landing page.
  if (name.startsWith("EXPO_PUBLIC_")) {
    throw new Error(
      `${name}: credentials must never come from an EXPO_PUBLIC_* variable — ` +
        "Expo compiles those into the shipped client bundle.",
    );
  }
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. See .env.ops.example.`);
  }
  return value;
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function accessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${claims}`)
    .sign(credentials.private_key, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }
  return (await response.json()).access_token;
}

// Read-only, and only the allow-listed columns. The tokens are never selected.
async function fetchSubscribers(url, secretKey) {
  const select = FIELDS.select.join(",");
  const endpoint =
    `${url}/rest/v1/updates_subscribers` +
    `?select=${select}&order=created_at.asc`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase read failed: ${await response.text()}`);
  }
  return response.json();
}

function toRows(subscribers) {
  return subscribers.map((row) => [
    row.email,
    row.created_at ? String(row.created_at).slice(0, 10) : "",
    // Plain words, not timestamps: the sheet answers "is this person on the
    // list", and confirmed_at IS NULL means NOT subscribed.
    row.confirmed_at ? "yes" : "no",
    row.unsubscribed_at ? "yes" : "no",
  ]);
}

async function writeSheet(token, sheetId, tab, rows) {
  const range = `${tab}!A:D`;

  // STEP 1 — clear the whole tab. This is the overwrite half of rule 1, and it
  // is what makes a deletion in the database reach the sheet.
  const cleared = await fetch(
    `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}:clear`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  );
  if (!cleared.ok) {
    throw new Error(`Sheet clear failed: ${await cleared.text()}`);
  }

  // STEP 2 — write the current contents in place. An update, never an append.
  const written = await fetch(
    `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}` +
      "?valueInputOption=RAW",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ range, majorDimension: "ROWS", values: rows }),
    },
  );
  if (!written.ok) {
    throw new Error(`Sheet write failed: ${await written.text()}`);
  }
}

async function main() {
  loadEnvFile(".env.local");

  const supabaseUrl = required("SUPABASE_URL");
  const secretKey = required("SUPABASE_SECRET_KEY");
  const credentialsPath = required("GOOGLE_SERVICE_ACCOUNT_JSON");
  const sheetId = required("UPDATES_SHEET_ID");
  const tab = process.env.UPDATES_SHEET_TAB || "Subscribers";

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

  const subscribers = await fetchSubscribers(supabaseUrl, secretKey);
  const rows = [FIELDS.headers, ...toRows(subscribers)];

  const token = await accessToken(credentials);
  await writeSheet(token, sheetId, tab, rows);

  const confirmed = subscribers.filter((r) => r.confirmed_at).length;
  const unsubscribed = subscribers.filter((r) => r.unsubscribed_at).length;
  console.log(
    `Overwrote "${tab}" with ${subscribers.length} rows ` +
      `(${confirmed} confirmed, ${unsubscribed} unsubscribed). ` +
      "The sheet now matches the database exactly.",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
