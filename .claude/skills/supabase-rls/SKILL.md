---
name: supabase-rls
description: Triggers on any new table or migration. Enforces default-deny RLS posture on every Supabase table.
---

# Supabase RLS Checklist

Apply to every new table, migration, or policy change.

## Default-deny posture
- [ ] `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;` present for every new table.
- [ ] No table exists without RLS enabled — verify before any data touches it.
- [ ] Default is DENY — explicit policies grant access, not the reverse.

## Policy design
- [ ] Each policy has a clear, documented intent (inline SQL comment).
- [ ] SELECT/INSERT/UPDATE/DELETE policies are separate and intentional.
- [ ] Policies use `auth.uid()` for user-scoped access.
- [ ] Admin/service-role access is backend-only, never client-side.

## Privileged access
- [ ] `service_role` key is NEVER exposed to the client.
- [ ] Every privileged action is logged to the append-only audit trail.

## Testing
- [ ] RLS policies have corresponding tests proving:
  - Authenticated user can access own data.
  - Authenticated user CANNOT access another user's data.
  - Unauthenticated request is denied.
  - Admin/service-role access works only through backend.

## Migration safety
- [ ] Expand -> backfill -> dual-read/dual-write -> contract pattern.
- [ ] Feature flags gate new schema until verified.
- [ ] Written data-repair playbook for rollback.
