from __future__ import annotations

from dataclasses import dataclass

from app.services.educational_guidance import build_guidance_input
from app.services.research_pulse_sources import PublicationCandidate


@dataclass(frozen=True)
class TopicDefinition:
    topic_group: str
    theme_key: str
    label: str
    diagnosis_code: str | None
    keywords: tuple[str, ...]


TOPIC_DEFINITIONS: tuple[TopicDefinition, ...] = (
    TopicDefinition("electrophysiology", "innovation", "Electrophysiology", None, ("electrophysiology", "ep", "electrophysiologist")),
    TopicDefinition("arrhythmia_subtype", "monitoring", "Atrial fibrillation", "afib", ("atrial fibrillation", "afib")),
    TopicDefinition("arrhythmia_subtype", "innovation", "Supraventricular tachycardia", "svt", ("supraventricular tachycardia", "svt")),
    TopicDefinition("arrhythmia_subtype", "innovation", "Ventricular tachycardia", "vt", ("ventricular tachycardia", "vt")),
    TopicDefinition("arrhythmia_subtype", "genetics", "Arrhythmogenic right ventricular cardiomyopathy", "arvc", ("arvc", "arrhythmogenic right ventricular cardiomyopathy")),
    TopicDefinition("arrhythmia_subtype", "genetics", "Long QT syndrome", "long_qt", ("long qt", "long qt syndrome", "lqts")),
    TopicDefinition("arrhythmia_subtype", "genetics", "Brugada syndrome", "brugada", ("brugada", "brugada syndrome")),
    TopicDefinition("arrhythmia_subtype", "innovation", "Wolff-Parkinson-White syndrome", "wpw", ("wolff-parkinson-white", "wpw")),
    TopicDefinition("treatment_device", "ablation", "Catheter ablation", None, ("ablation", "catheter ablation", "pulmonary vein isolation")),
    TopicDefinition("treatment_device", "device", "Device therapy", None, ("icd", "implantable cardioverter", "pacemaker", "device therapy")),
    TopicDefinition("treatment_device", "medication", "Medication therapy", None, ("antiarrhythmic", "medication", "drug therapy")),
    TopicDefinition("innovation_mapping_genetics", "mapping", "Mapping and imaging", None, ("mapping", "electroanatomic mapping", "substrate mapping")),
    TopicDefinition("innovation_mapping_genetics", "genetics", "Genetics", None, ("genetic", "genetics", "genotype", "variant")),
    TopicDefinition("innovation_mapping_genetics", "innovation", "Innovation", None, ("innovation", "novel", "new approach", "next-generation")),
    TopicDefinition("mental_health_qol", "mental_health", "Mental health", None, ("anxiety", "depression", "ptsd", "mental health", "distress")),
    TopicDefinition("mental_health_qol", "quality_of_life", "Quality of life", None, ("quality of life", "qol", "daily life", "symptom burden")),
)


def _haystack(*parts: str | None) -> str:
    return " ".join(part.lower() for part in parts if part)


def classify_publication_candidate(candidate: PublicationCandidate) -> list[dict[str, object]]:
    haystack = _haystack(
        candidate.title,
        candidate.abstract_text,
        candidate.article_type,
        candidate.study_design,
        candidate.journal_name,
    )
    matches: list[dict[str, object]] = []
    for topic in TOPIC_DEFINITIONS:
        hit_count = sum(1 for keyword in topic.keywords if keyword in haystack)
        if hit_count == 0:
            continue
        confidence = min(1.0, 0.45 + hit_count * 0.18)
        matches.append(
            {
                "topic_group": topic.topic_group,
                "diagnosis_code": topic.diagnosis_code,
                "theme_key": topic.theme_key,
                "label": topic.label,
                "confidence": round(confidence, 3),
                "assignment_source": "rule",
            }
        )
    deduped: dict[tuple[str | None, str, str], dict[str, object]] = {}
    for match in matches:
        key = (match.get("diagnosis_code"), str(match["theme_key"]), str(match["label"]))
        existing = deduped.get(key)
        if existing is None or float(match["confidence"]) > float(existing["confidence"]):
            deduped[key] = match
    return list(deduped.values())


def build_profile_relevance_input(db, profile_id: str) -> dict[str, object]:
    guidance_input = build_guidance_input(db, profile_id)
    snapshot = guidance_input.self_reported_profile_snapshot
    return {
        "profile_id": profile_id,
        "locale": guidance_input.locale,
        "diagnosis_code": snapshot.diagnosis_selection.diagnosis_code,
        "physical_symptoms": snapshot.physical_symptoms,
        "emotional_context": snapshot.emotional_context,
        "ablation_count": snapshot.treatment_history.ablation_count,
        "has_implantable_device": snapshot.treatment_history.has_implantable_device,
        "current_medications": snapshot.treatment_history.current_medications,
        "prior_procedures": snapshot.treatment_history.prior_procedures,
        "personal_narrative": snapshot.personal_narrative or "",
    }


def score_publication_for_profile(
    *,
    publication_title: str,
    publication_summary: str,
    publication_topics: list[dict[str, object]],
    profile_relevance_input: dict[str, object],
) -> tuple[float, dict[str, object]]:
    diagnosis_code = str(profile_relevance_input["diagnosis_code"])
    symptoms = [value.lower() for value in profile_relevance_input["physical_symptoms"]]
    emotional_context = [value.lower() for value in profile_relevance_input["emotional_context"]]
    current_medications = [value.lower() for value in profile_relevance_input["current_medications"]]
    prior_procedures = [value.lower() for value in profile_relevance_input["prior_procedures"]]
    personal_narrative = str(profile_relevance_input["personal_narrative"]).lower()
    haystack = _haystack(publication_title, publication_summary)

    score = 0.0
    rationale: dict[str, object] = {
        "diagnosis_match": False,
        "topic_matches": [],
        "keyword_matches": [],
        "treatment_context_matches": [],
        "mental_health_match": False,
    }

    for topic in publication_topics:
        topic_diagnosis = topic.get("diagnosis_code")
        if topic_diagnosis and topic_diagnosis == diagnosis_code:
            score += 0.45
            rationale["diagnosis_match"] = True
        if topic.get("theme_key") in {"ablation", "device", "medication", "mapping", "genetics", "innovation"}:
            rationale["topic_matches"].append(topic["label"])

    profile_keywords = set(symptoms + emotional_context + current_medications + prior_procedures)
    if profile_relevance_input["ablation_count"]:
        profile_keywords.add("ablation")
    if profile_relevance_input["has_implantable_device"]:
        profile_keywords.update({"device", "icd", "pacemaker"})
    for keyword in profile_keywords:
        if keyword and keyword in haystack:
            score += 0.08
            rationale["keyword_matches"].append(keyword)
    if any(keyword in haystack for keyword in ("anxiety", "depression", "quality of life", "distress", "ptsd")):
        if emotional_context:
            score += 0.12
            rationale["mental_health_match"] = True
    if personal_narrative:
        for keyword in ("ablation", "device", "monitoring", "genetic", "quality of life"):
            if keyword in personal_narrative and keyword in haystack:
                score += 0.05
                rationale["treatment_context_matches"].append(keyword)

    normalized_score = round(min(score, 1.0), 4)
    return normalized_score, rationale
