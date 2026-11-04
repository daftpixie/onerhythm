-- OneRhythm Phase 1B seed — initial communities only.
-- No members, no health data, no content. Plain, welcoming names and blurbs.
-- New communities can later be created via Tier-1 governance (Phase 3).

insert into public.communities (slug, name, description, is_caregiver) values
  ('afib',           'AFib',            'For people living with atrial fibrillation.', false),
  ('svt',            'SVT',             'For people living with supraventricular tachycardia.', false),
  ('arvc',           'ARVC',            'For people living with arrhythmogenic right ventricular cardiomyopathy.', false),
  ('long-qt',        'Long QT',         'For people living with long QT syndrome.', false),
  ('vt',             'VT',              'For people living with ventricular tachycardia.', false),
  ('pvcs',           'PVCs',            'For people living with premature ventricular contractions.', false),
  ('post-ablation',  'Post-ablation',   'For people recovering from or living after an ablation.', false),
  ('icd-recipients', 'ICD recipients',  'For people who have an implanted defibrillator.', false),
  ('caregivers',     'Caregivers',      'A space for the people who care for someone with an arrhythmia.', true),
  ('general',        'General',         'A welcoming space for everyone, whatever brought you here.', false)
on conflict (slug) do nothing;

-- Controlled vocabulary for the OPT-IN health self-ID (consent-gated at use).
-- This is NOT member data — it is the allowed set members may choose from in
-- onboarding step 2 (wireframe B3). Plain, member-facing labels. Codes are
-- stable; the set is governance-extensible later (ADR 0003 #5 / ADR 0004).
-- Diagnosis set reconciled with B3 (adds post_ablation + icd_recipient).
insert into public.self_id_tags (tag_type, code, label) values
  ('diagnosis',         'afib',                'AFib'),
  ('diagnosis',         'svt',                 'SVT'),
  ('diagnosis',         'arvc',                'ARVC'),
  ('diagnosis',         'long_qt',             'Long QT'),
  ('diagnosis',         'vt',                  'VT'),
  ('diagnosis',         'pvcs',                'PVCs'),
  ('diagnosis',         'post_ablation',       'Post-ablation'),
  ('diagnosis',         'icd_recipient',       'ICD recipient'),
  ('physical_symptom',  'palpitations',        'Palpitations'),
  ('physical_symptom',  'dizziness',           'Dizziness'),
  ('physical_symptom',  'shortness_of_breath', 'Shortness of breath'),
  ('physical_symptom',  'fatigue',             'Fatigue'),
  ('physical_symptom',  'chest_discomfort',    'Chest discomfort'),
  ('physical_symptom',  'syncope',             'Fainting'),
  ('emotional_symptom', 'anxiety',             'Anxiety'),
  ('emotional_symptom', 'depression',          'Low mood'),
  ('emotional_symptom', 'fear_of_recurrence',  'Fear of episodes'),
  ('emotional_symptom', 'sleep_difficulty',    'Trouble sleeping')
on conflict (code) do nothing;
