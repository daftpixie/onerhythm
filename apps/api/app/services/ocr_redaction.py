from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from importlib import import_module
from importlib.metadata import version
import re
from pathlib import Path
from statistics import mean
from typing import Any, Protocol

import numpy as np
from PIL import Image, ImageDraw
import pypdfium2 as pdfium

OCR_CONFIDENCE_THRESHOLD = 0.55
OCR_REDACTION_PADDING_PX = 8
PDF_RENDER_SCALE = 2.0
LAYOUT_HEADER_CUTOFF_RATIO = 0.11
LAYOUT_FOOTER_CUTOFF_RATIO = 0.9
LAYOUT_LABEL_MAX_WIDTH_RATIO = 0.12
LAYOUT_LABEL_MAX_HEIGHT_RATIO = 0.075
LAYOUT_MIN_GEOMETRY_REGIONS = 8
LAYOUT_MIN_X_CLUSTERS = 3
LAYOUT_MIN_Y_CLUSTERS = 4
LONG_STRIP_MIN_LOWER_REGIONS = 2

ECG_LEAD_LABELS = {
    "i",
    "ii",
    "iii",
    "avr",
    "avl",
    "avf",
    "v1",
    "v2",
    "v3",
    "v4",
    "v5",
    "v6",
}
MIN_STANDARD_TWELVE_LEAD_LABELS = 10
NORMALIZED_LEAD_LABELS = {
    "i": "i",
    "leadi": "i",
    "ii": "ii",
    "leadii": "ii",
    "iii": "iii",
    "leadiii": "iii",
    "avr": "avr",
    "leadavr": "avr",
    "avl": "avl",
    "leadavl": "avl",
    "avf": "avf",
    "leadavf": "avf",
    "v1": "v1",
    "leadv1": "v1",
    "v2": "v2",
    "leadv2": "v2",
    "v3": "v3",
    "leadv3": "v3",
    "v4": "v4",
    "leadv4": "v4",
    "v5": "v5",
    "leadv5": "v5",
    "v6": "v6",
    "leadv6": "v6",
}
PAPER_SPEED_PATTERNS = {
    25: re.compile(r"\b25\s*mm\s*/?\s*s(?:ec)?\b", re.IGNORECASE),
    50: re.compile(r"\b50\s*mm\s*/?\s*s(?:ec)?\b", re.IGNORECASE),
}

IDENTIFIER_KEYWORDS = (
    "account",
    "accession",
    "address",
    "dob",
    "doctor",
    "email",
    "fax",
    "id",
    "medical record",
    "mrn",
    "name",
    "patient",
    "phone",
    "physician",
    "record",
    "ssn",
)
DATE_LIKE_PATTERN = re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b")
EMAIL_LIKE_PATTERN = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_LIKE_PATTERN = re.compile(r"\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b")
LONG_NUMERIC_PATTERN = re.compile(r"\b\d{6,}\b")


@dataclass(frozen=True)
class OCRTextDetection:
    bounding_polygon: tuple[tuple[int, int], ...]
    text: str
    confidence: float


@dataclass(frozen=True)
class OCRRedactionResult:
    redacted_path: Path
    summary: dict
    phi_redaction_applied: bool


class OCRRedactionError(RuntimeError):
    def __init__(self, *, summary: dict) -> None:
        super().__init__("The OCR redaction stage failed.")
        self.summary = summary


class OCRTextDetectionProvider(Protocol):
    @property
    def provider_name(self) -> str:
        ...

    @property
    def provider_version(self) -> str:
        ...

    def detect_text(self, *, image: Image.Image) -> list[OCRTextDetection]:
        ...


class OCRRedactionService(Protocol):
    @property
    def provider_name(self) -> str:
        ...

    def redact(self, *, source_path: Path, upload_format: str) -> OCRRedactionResult:
        ...


class RapidOCRTextDetectionProvider:
    def __init__(self) -> None:
        self._engine: Any | None = None

    @property
    def provider_name(self) -> str:
        return "rapidocr-onnxruntime"

    @property
    def provider_version(self) -> str:
        return version("rapidocr-onnxruntime")

    def _get_engine(self) -> Any:
        if self._engine is None:
            try:
                rapidocr_module = import_module("rapidocr_onnxruntime")
                rapidocr_factory = getattr(rapidocr_module, "RapidOCR")
                self._engine = rapidocr_factory()
            except Exception as exc:
                raise RuntimeError(
                    "rapidocr-onnxruntime could not be initialized. Verify the API image "
                    "includes the required OpenCV runtime libraries."
                ) from exc
        return self._engine

    def detect_text(self, *, image: Image.Image) -> list[OCRTextDetection]:
        results, _ = self._get_engine()(np.array(image.convert("RGB")))
        detections: list[OCRTextDetection] = []
        for result in results or []:
            if len(result) != 3:
                continue
            polygon, text, confidence = result
            normalized_text = str(text).strip()
            if not normalized_text:
                continue
            detections.append(
                OCRTextDetection(
                    bounding_polygon=tuple(
                        (
                            int(round(float(point[0]))),
                            int(round(float(point[1]))),
                        )
                        for point in polygon
                    ),
                    text=normalized_text,
                    confidence=float(confidence),
                )
            )
        return detections


class LocalOCRRedactionService:
    def __init__(self, *, provider: OCRTextDetectionProvider) -> None:
        self._provider = provider

    @property
    def provider_name(self) -> str:
        return self._provider.provider_name

    def redact(self, *, source_path: Path, upload_format: str) -> OCRRedactionResult:
        report = self._base_report(upload_format=upload_format)
        failure_stage = "load_input"
        try:
            image, output_format = self._load_input_image(
                source_path=source_path,
                upload_format=upload_format,
            )
            report["pages_processed"] = 1
            report["ocr_ran"] = True
            report["output_format"] = output_format
            report["input_dimensions"] = [image.width, image.height]

            failure_stage = "text_detection"
            detections = self._provider.detect_text(image=image)
            accepted_detections = [
                detection
                for detection in detections
                if detection.confidence >= OCR_CONFIDENCE_THRESHOLD
            ]
            report["detected_text_region_count"] = len(accepted_detections)
            report["ignored_low_confidence_region_count"] = max(
                len(detections) - len(accepted_detections),
                0,
            )
            report["confidence_summary"] = _confidence_summary(accepted_detections)
            report["document_layout"] = _summarize_ecg_document_layout(
                accepted_detections,
                image_size=image.size,
            )

            redacted_image = image.copy()
            redaction_report = _redact_detected_regions(redacted_image, accepted_detections)
            report["redacted_regions"] = redaction_report["regions"]
            report["redacted_region_count"] = len(redaction_report["regions"])
            report["signal_counts"] = redaction_report["signal_counts"]
            report["redaction_applied"] = bool(redaction_report["regions"])

            failure_stage = "write_output"
            redacted_path = self._write_redacted_artifact(
                redacted_image=redacted_image,
                source_path=source_path,
                upload_format=upload_format,
            )
            report["status"] = "completed"
            return OCRRedactionResult(
                redacted_path=redacted_path,
                phi_redaction_applied=bool(redaction_report["regions"]),
                summary=report,
            )
        except OCRRedactionError:
            raise
        except Exception as exc:
            report["status"] = "failed"
            report["failure_stage"] = failure_stage
            report["failure_reason"] = exc.__class__.__name__
            raise OCRRedactionError(summary=report) from exc

    def _base_report(self, *, upload_format: str) -> dict:
        return {
            "stage": "ocr_redaction",
            "status": "not_started",
            "provider": self._provider.provider_name,
            "provider_version": self._provider.provider_version,
            "input_format": upload_format,
            "output_format": upload_format,
            "ocr_ran": False,
            "pages_processed": 0,
            "detected_text_region_count": 0,
            "ignored_low_confidence_region_count": 0,
            "redacted_region_count": 0,
            "redaction_applied": False,
            "confidence_threshold": OCR_CONFIDENCE_THRESHOLD,
            "recognized_text_persisted": False,
            "redacted_regions": [],
            "signal_counts": {},
            "hipaa_identifier_controls": [
                "visible_text_overlays_redacted_before_downstream_use",
                "recognized_text_used_in_memory_only",
                "recognized_text_not_persisted",
                "redacted_artifact_written_only_to_temp_workspace",
            ],
        }

    def _load_input_image(self, *, source_path: Path, upload_format: str) -> tuple[Image.Image, str]:
        if upload_format in {"jpeg", "png"}:
            with Image.open(source_path) as image:
                return image.convert("RGB"), upload_format

        if upload_format != "pdf":
            raise ValueError(f"Unsupported upload format: {upload_format}")

        document = pdfium.PdfDocument(str(source_path))
        try:
            page = document[0]
            rendered = page.render(scale=PDF_RENDER_SCALE)
            return rendered.to_pil().convert("RGB"), "pdf"
        finally:
            document.close()

    def _write_redacted_artifact(
        self,
        *,
        redacted_image: Image.Image,
        source_path: Path,
        upload_format: str,
    ) -> Path:
        output_path = source_path.with_name(f"{source_path.stem}.redacted.{upload_format}")
        if upload_format == "jpeg":
            redacted_image.save(
                output_path,
                format="JPEG",
                quality=95,
                optimize=True,
            )
            return output_path
        if upload_format == "png":
            redacted_image.save(output_path, format="PNG")
            return output_path
        if upload_format == "pdf":
            redacted_image.save(output_path, format="PDF", resolution=150.0)
            return output_path
        raise ValueError(f"Unsupported upload format: {upload_format}")


def _confidence_summary(detections: list[OCRTextDetection]) -> dict | None:
    if not detections:
        return None
    scores = [round(detection.confidence, 4) for detection in detections]
    return {
        "min": min(scores),
        "max": max(scores),
        "mean": round(mean(scores), 4),
    }


def _redact_detected_regions(
    image: Image.Image,
    detections: list[OCRTextDetection],
) -> dict:
    draw = ImageDraw.Draw(image)
    redacted_regions: list[dict] = []
    signal_counts: dict[str, int] = {}
    for detection in detections:
        left, top, right, bottom = _expanded_box(detection.bounding_polygon, image.size)
        draw.rectangle([left, top, right, bottom], fill="black")
        signals = _classify_signals(detection.text)
        for signal in signals:
            signal_counts[signal] = signal_counts.get(signal, 0) + 1
        redacted_regions.append(
            {
                "page_index": 1,
                "bounding_box": [left, top, right, bottom],
                "confidence": round(detection.confidence, 4),
                "reasons": signals,
            }
        )
    return {
        "regions": redacted_regions,
        "signal_counts": signal_counts,
    }


def _expanded_box(
    bounding_polygon: tuple[tuple[int, int], ...],
    image_size: tuple[int, int],
) -> tuple[int, int, int, int]:
    xs = [point[0] for point in bounding_polygon]
    ys = [point[1] for point in bounding_polygon]
    width, height = image_size
    left = max(min(xs) - OCR_REDACTION_PADDING_PX, 0)
    top = max(min(ys) - OCR_REDACTION_PADDING_PX, 0)
    right = min(max(xs) + OCR_REDACTION_PADDING_PX, width)
    bottom = min(max(ys) + OCR_REDACTION_PADDING_PX, height)
    return left, top, right, bottom


def _classify_signals(text: str) -> list[str]:
    normalized = text.lower()
    signals = ["visible_text_overlay"]
    if any(keyword in normalized for keyword in IDENTIFIER_KEYWORDS):
        signals.append("identifier_keyword")
    if DATE_LIKE_PATTERN.search(normalized):
        signals.append("date_like_text")
    if EMAIL_LIKE_PATTERN.search(normalized):
        signals.append("email_like_text")
    if PHONE_LIKE_PATTERN.search(normalized):
        signals.append("phone_like_text")
    if LONG_NUMERIC_PATTERN.search(normalized):
        signals.append("numeric_identifier_like_text")
    return signals


def _summarize_ecg_document_layout(
    detections: list[OCRTextDetection],
    *,
    image_size: tuple[int, int],
) -> dict:
    lead_counts: dict[str, int] = {}
    paper_speed_mm_per_sec: int | None = None

    for detection in detections:
        normalized_text = _normalize_detection_text(detection.text)
        if paper_speed_mm_per_sec is None:
            for candidate_speed, pattern in PAPER_SPEED_PATTERNS.items():
                if pattern.search(normalized_text):
                    paper_speed_mm_per_sec = candidate_speed
                    break

        lead_label = _match_ecg_lead_label(normalized_text)
        if lead_label is not None:
            lead_counts[lead_label] = lead_counts.get(lead_label, 0) + 1

    unique_lead_label_count = len(lead_counts)
    repeated_lead_label_count = sum(1 for count in lead_counts.values() if count > 1)
    geometry_hint = _summarize_layout_geometry_hint(
        detections,
        image_size=image_size,
        lead_label_count=unique_lead_label_count,
        paper_speed_mm_per_sec=paper_speed_mm_per_sec,
    )
    standard_twelve_lead_detected = (
        unique_lead_label_count >= MIN_STANDARD_TWELVE_LEAD_LABELS
        or geometry_hint["supports_standard_twelve_lead"]
    )
    long_rhythm_strip_detected = (
        lead_counts.get("ii", 0) >= 2
        or geometry_hint["supports_long_rhythm_strip"]
    )

    if unique_lead_label_count >= MIN_STANDARD_TWELVE_LEAD_LABELS:
        layout_detection_basis = "ocr_labels"
    elif geometry_hint["supports_standard_twelve_lead"]:
        layout_detection_basis = (
            "hybrid_geometry_plus_ocr"
            if unique_lead_label_count > 0
            else "geometry_hint"
        )
    elif unique_lead_label_count == 1:
        layout_detection_basis = "single_label_hint"
    else:
        layout_detection_basis = "insufficient_signal"

    if standard_twelve_lead_detected and long_rhythm_strip_detected:
        layout_kind = "standard_12_lead_with_long_strip"
        layout_confidence = (
            "high" if layout_detection_basis == "ocr_labels" else "medium"
        )
    elif unique_lead_label_count == 1:
        layout_kind = "single_lead_segment"
        layout_confidence = "medium" if paper_speed_mm_per_sec else "low"
    elif standard_twelve_lead_detected:
        layout_kind = "standard_12_lead"
        layout_confidence = (
            "medium" if layout_detection_basis == "ocr_labels" else "low"
        )
    else:
        layout_kind = "unknown"
        layout_confidence = "low"

    return {
        "layout_kind": layout_kind,
        "layout_confidence": layout_confidence,
        "paper_speed_mm_per_sec": paper_speed_mm_per_sec,
        "detected_lead_label_count": unique_lead_label_count,
        "repeated_lead_label_count": repeated_lead_label_count,
        "standard_twelve_lead_detected": standard_twelve_lead_detected,
        "long_rhythm_strip_detected": long_rhythm_strip_detected,
        "layout_detection_basis": layout_detection_basis,
        "geometry_hint": geometry_hint,
    }


def _summarize_layout_geometry_hint(
    detections: list[OCRTextDetection],
    *,
    image_size: tuple[int, int],
    lead_label_count: int,
    paper_speed_mm_per_sec: int | None,
) -> dict:
    image_width, image_height = image_size
    if image_width <= 0 or image_height <= 0:
        return {
            "candidate_region_count": 0,
            "x_cluster_count": 0,
            "y_cluster_count": 0,
            "lower_band_region_count": 0,
            "supports_standard_twelve_lead": False,
            "supports_long_rhythm_strip": False,
        }

    header_cutoff = image_height * LAYOUT_HEADER_CUTOFF_RATIO
    footer_cutoff = image_height * LAYOUT_FOOTER_CUTOFF_RATIO
    max_label_width = image_width * LAYOUT_LABEL_MAX_WIDTH_RATIO
    max_label_height = image_height * LAYOUT_LABEL_MAX_HEIGHT_RATIO
    lower_band_cutoff = image_height * 0.34

    candidate_x_centers: list[float] = []
    candidate_y_centers: list[float] = []
    lower_band_region_count = 0

    for detection in detections:
        left, top, right, bottom = _polygon_box(detection.bounding_polygon)
        width = right - left
        height = bottom - top
        center_x = (left + right) / 2
        center_y = (top + bottom) / 2

        if top < header_cutoff or bottom > footer_cutoff:
            continue
        if width > max_label_width or height > max_label_height:
            continue

        candidate_x_centers.append(center_x)
        candidate_y_centers.append(center_y)
        if center_y >= lower_band_cutoff:
            lower_band_region_count += 1

    x_clusters = _cluster_positions(
        candidate_x_centers,
        threshold=max(image_width * 0.05, 20.0),
    )
    y_clusters = _cluster_positions(
        candidate_y_centers,
        threshold=max(image_height * 0.012, 10.0),
    )
    supports_standard_twelve_lead = (
        paper_speed_mm_per_sec in {25, 50}
        and lead_label_count >= 1
        and len(candidate_x_centers) >= LAYOUT_MIN_GEOMETRY_REGIONS
        and len(x_clusters) >= LAYOUT_MIN_X_CLUSTERS
        and len(y_clusters) >= LAYOUT_MIN_Y_CLUSTERS
    )
    supports_long_rhythm_strip = (
        supports_standard_twelve_lead
        and lower_band_region_count >= LONG_STRIP_MIN_LOWER_REGIONS
    )

    return {
        "candidate_region_count": len(candidate_x_centers),
        "x_cluster_count": len(x_clusters),
        "y_cluster_count": len(y_clusters),
        "lower_band_region_count": lower_band_region_count,
        "supports_standard_twelve_lead": supports_standard_twelve_lead,
        "supports_long_rhythm_strip": supports_long_rhythm_strip,
    }


def _polygon_box(
    bounding_polygon: tuple[tuple[int, int], ...],
) -> tuple[int, int, int, int]:
    xs = [point[0] for point in bounding_polygon]
    ys = [point[1] for point in bounding_polygon]
    return min(xs), min(ys), max(xs), max(ys)


def _cluster_positions(values: list[float], *, threshold: float) -> list[list[float]]:
    clusters: list[list[float]] = []
    for value in sorted(values):
        if not clusters or abs(value - clusters[-1][-1]) > threshold:
            clusters.append([value])
            continue
        clusters[-1].append(value)
    return clusters


def _normalize_detection_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _match_ecg_lead_label(normalized_text: str) -> str | None:
    collapsed = re.sub(r"[^a-z0-9]", "", normalized_text)
    return NORMALIZED_LEAD_LABELS.get(collapsed)


@lru_cache(maxsize=1)
def build_default_ocr_redaction_service() -> OCRRedactionService:
    return LocalOCRRedactionService(provider=RapidOCRTextDetectionProvider())
