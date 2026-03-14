from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from importlib.metadata import version
import re
from pathlib import Path
from statistics import mean
from typing import Protocol

import numpy as np
from PIL import Image, ImageDraw
from rapidocr_onnxruntime import RapidOCR
import pypdfium2 as pdfium

OCR_CONFIDENCE_THRESHOLD = 0.55
OCR_REDACTION_PADDING_PX = 8
PDF_RENDER_SCALE = 2.0

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
        self._engine: RapidOCR | None = None

    @property
    def provider_name(self) -> str:
        return "rapidocr-onnxruntime"

    @property
    def provider_version(self) -> str:
        return version("rapidocr-onnxruntime")

    def _get_engine(self) -> RapidOCR:
        if self._engine is None:
            self._engine = RapidOCR()
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


@lru_cache(maxsize=1)
def build_default_ocr_redaction_service() -> OCRRedactionService:
    return LocalOCRRedactionService(provider=RapidOCRTextDetectionProvider())
