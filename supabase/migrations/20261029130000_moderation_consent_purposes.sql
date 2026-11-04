-- OneRhythm — moderation build step 3, part 1 of 3: two new consent purposes.
--
-- ADR 0019 §6 names them, as .claude/rules/db.md requires ("each purpose named
-- in its own ADR"):
--
--   moderator_public_name  An interim moderator agrees to be named publicly
--                          (Q3). Being named shows membership of a heart-rhythm
--                          community, which is health-adjacent, so it is an
--                          unchecked opt-in that can be withdrawn. Withdrawing
--                          it removes the name and ends the interim grant.
--   reexam_show_name       A member who asks for a floor item to be
--                          re-examined chooses to have their name shown beside
--                          the published answer. Unchecked by default. (The
--                          column it governs is not built yet; see part 2.)
--
-- Neither has a boolean column anywhere: the consent ledger is the only record.
--
-- This file stands alone because a new enum value cannot be used in the same
-- transaction that adds it, and parts 2 and 3 use both values.
--
-- Not health_self_id: has_current_health_consent() is unchanged. Moderation
-- code reads these purposes only through has_current_consent() (part 3).

alter type public.consent_purpose add value if not exists 'moderator_public_name';
alter type public.consent_purpose add value if not exists 'reexam_show_name';
