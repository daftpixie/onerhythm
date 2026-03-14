from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import pypdfium2 as pdfium

from app.services.ocr_redaction import (
    LocalOCRRedactionService,
    OCRRedactionError,
    OCRTextDetection,
    RapidOCRTextDetectionProvider,
)


def _write_text_artifact(path: Path, *, lines: list[str]) -> None:
    image = Image.new("RGB", (1200, 400), "white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("DejaVuSans.ttf", 48)
    y = 40
    for line in lines:
        draw.text((40, y), line, fill="black", font=font)
        y += 80

    if path.suffix.lower() == ".pdf":
        image.save(path, format="PDF", resolution=150.0)
    elif path.suffix.lower() in {".jpg", ".jpeg"}:
        image.save(path, format="JPEG", quality=95, optimize=True)
    else:
        image.save(path, format="PNG")


def _sample_pixel(
    path: Path,
    *,
    bbox: list[int],
    upload_format: str,
    reference_dimensions: list[int] | None = None,
) -> tuple[int, int, int]:
    left, top, right, bottom = bbox
    if upload_format == "pdf":
        document = pdfium.PdfDocument(str(path))
        try:
            rendered = document[0].render(scale=1)
            image = rendered.to_pil().convert("RGB")
            if reference_dimensions:
                x_ratio = image.width / reference_dimensions[0]
                y_ratio = image.height / reference_dimensions[1]
                sample_point = (
                    int(((left + right) / 2) * x_ratio),
                    int(((top + bottom) / 2) * y_ratio),
                )
            else:
                sample_point = ((left + right) // 2, (top + bottom) // 2)
            return image.getpixel(sample_point)
        finally:
            document.close()

    sample_point = ((left + right) // 2, (top + bottom) // 2)
    with Image.open(path) as image:
        return image.convert("RGB").getpixel(sample_point)


def _is_blackish(pixel: tuple[int, int, int]) -> bool:
    return all(channel <= 20 for channel in pixel)


class StaticTextDetectionProvider:
    provider_name = "static-provider"
    provider_version = "test"

    def __init__(self, detections: list[OCRTextDetection]) -> None:
        self._detections = detections

    def detect_text(self, *, image: Image.Image) -> list[OCRTextDetection]:
        return list(self._detections)


class FailingTextDetectionProvider:
    provider_name = "failing-provider"
    provider_version = "test"

    def detect_text(self, *, image: Image.Image) -> list[OCRTextDetection]:
        raise RuntimeError("provider_unavailable")


class OCRRedactionServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.actual_service = LocalOCRRedactionService(provider=RapidOCRTextDetectionProvider())

    def test_service_redacts_detected_regions_for_raster_formats(self) -> None:
        detection = OCRTextDetection(
            bounding_polygon=((40, 40), (480, 40), (480, 120), (40, 120)),
            text="Patient: Jane Doe",
            confidence=0.99,
        )
        service = LocalOCRRedactionService(
            provider=StaticTextDetectionProvider([detection]),
        )

        for upload_format, suffix in (("png", ".png"), ("jpeg", ".jpg")):
            with self.subTest(upload_format=upload_format):
                with tempfile.TemporaryDirectory() as temp_dir:
                    source_path = Path(temp_dir) / f"source{suffix}"
                    _write_text_artifact(
                        source_path,
                        lines=["Patient: Jane Doe", "MRN: 123456"],
                    )

                    result = service.redact(
                        source_path=source_path,
                        upload_format=upload_format,
                    )

                    self.assertTrue(result.redacted_path.exists())
                    self.assertTrue(result.phi_redaction_applied)
                    self.assertEqual(result.summary["status"], "completed")
                    self.assertEqual(result.summary["detected_text_region_count"], 1)
                    self.assertEqual(result.summary["redacted_region_count"], 1)
                    self.assertTrue(
                        _is_blackish(
                            _sample_pixel(
                                result.redacted_path,
                                bbox=result.summary["redacted_regions"][0]["bounding_box"],
                                upload_format=upload_format,
                            )
                        )
                    )

    def test_service_returns_completed_summary_when_no_text_is_detected(self) -> None:
        service = LocalOCRRedactionService(provider=StaticTextDetectionProvider([]))

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "source.png"
            Image.new("RGB", (600, 240), "white").save(source_path, format="PNG")

            result = service.redact(source_path=source_path, upload_format="png")

        self.assertFalse(result.phi_redaction_applied)
        self.assertEqual(result.summary["status"], "completed")
        self.assertEqual(result.summary["detected_text_region_count"], 0)
        self.assertEqual(result.summary["redacted_region_count"], 0)
        self.assertEqual(result.summary["redacted_regions"], [])

    def test_service_wraps_provider_failures_with_a_structured_report(self) -> None:
        service = LocalOCRRedactionService(provider=FailingTextDetectionProvider())

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "source.png"
            Image.new("RGB", (600, 240), "white").save(source_path, format="PNG")

            with self.assertRaises(OCRRedactionError) as context:
                service.redact(source_path=source_path, upload_format="png")

        self.assertEqual(context.exception.summary["status"], "failed")
        self.assertEqual(context.exception.summary["failure_stage"], "text_detection")
        self.assertEqual(context.exception.summary["provider"], "failing-provider")
        self.assertFalse(context.exception.summary["recognized_text_persisted"])

    def test_rapidocr_provider_redacts_single_page_pdf(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "source.pdf"
            _write_text_artifact(
                source_path,
                lines=["Patient: Jane Doe", "DOB: 01/01/1980"],
            )

            result = self.actual_service.redact(source_path=source_path, upload_format="pdf")
            self.assertTrue(result.redacted_path.exists())
            self.assertTrue(
                _is_blackish(
                    _sample_pixel(
                        result.redacted_path,
                        bbox=result.summary["redacted_regions"][0]["bounding_box"],
                        upload_format="pdf",
                        reference_dimensions=result.summary["input_dimensions"],
                    )
                )
            )

        self.assertTrue(result.phi_redaction_applied)
        self.assertEqual(result.summary["status"], "completed")
        self.assertEqual(result.summary["input_format"], "pdf")
        self.assertEqual(result.summary["output_format"], "pdf")
        self.assertGreaterEqual(result.summary["redacted_region_count"], 1)
        self.assertEqual(result.summary["provider"], "rapidocr-onnxruntime")


if __name__ == "__main__":
    unittest.main()
