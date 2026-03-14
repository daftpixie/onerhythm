from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

from app.services.artistic_transform import (
    DERIVATION_FAMILY,
    MOSAIC_TILE_VERSION,
    COARSE_GRID_DIMENSION,
    OUTPUT_ARTIFACT_DIMENSION,
    QUANTIZATION_LEVELS,
    TILE_DERIVATION_VERSION,
    build_default_artistic_transform_service,
    derive_tile_visual_style_from_artifact,
)


def _write_ecg_like_artifact(path: Path) -> None:
    image = Image.new("RGB", (1200, 400), "white")
    draw = ImageDraw.Draw(image)

    for x in range(0, 1200, 40):
        draw.line([(x, 0), (x, 400)], fill=(228, 228, 228), width=1)
    for y in range(0, 400, 40):
        draw.line([(0, y), (1200, y)], fill=(228, 228, 228), width=1)

    points = [
        (0, 220),
        (110, 220),
        (150, 212),
        (180, 220),
        (215, 220),
        (240, 132),
        (260, 290),
        (300, 220),
        (360, 220),
        (420, 210),
        (470, 220),
        (560, 220),
        (620, 155),
        (655, 275),
        (710, 220),
        (1200, 220),
    ]
    draw.line(points, fill="black", width=5)

    if path.suffix.lower() == ".pdf":
        image.save(path, format="PDF", resolution=150.0)
    else:
        image.save(path, format="PNG")


def _unique_grayscale_levels(path: Path) -> int:
    with Image.open(path) as image:
        grayscale = image.convert("L")
        return len(set(grayscale.get_flattened_data()))


class ArtisticTransformTests(unittest.TestCase):
    def test_transform_creates_destructive_low_fidelity_png_artifact(self) -> None:
        service = build_default_artistic_transform_service()

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "redacted.png"
            _write_ecg_like_artifact(source_path)

            result = service.transform(source_path=source_path, upload_format="png")

            self.assertTrue(result.transformed_path.exists())
            self.assertEqual(result.transformed_path.suffix, ".png")
            self.assertEqual(result.summary["status"], "completed")
            self.assertFalse(result.summary["clinical_interpretation_supported"])
            self.assertFalse(result.summary["biometric_fidelity_preserved"])
            self.assertEqual(result.summary["output_dimensions"], [OUTPUT_ARTIFACT_DIMENSION, OUTPUT_ARTIFACT_DIMENSION])
            self.assertEqual(result.summary["coarse_grid_dimensions"], [COARSE_GRID_DIMENSION, COARSE_GRID_DIMENSION])
            self.assertLessEqual(_unique_grayscale_levels(result.transformed_path), QUANTIZATION_LEVELS)
            self.assertNotEqual(source_path.read_bytes(), result.transformed_path.read_bytes())

    def test_transform_supports_single_page_pdf_input(self) -> None:
        service = build_default_artistic_transform_service()

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "redacted.pdf"
            _write_ecg_like_artifact(source_path)

            result = service.transform(source_path=source_path, upload_format="pdf")

            self.assertTrue(result.transformed_path.exists())
            self.assertEqual(result.transformed_path.suffix, ".png")
            self.assertEqual(result.summary["input_format"], "pdf")
            self.assertEqual(result.summary["output_format"], "png")
            self.assertTrue(result.summary["derived_artifact_retained_only_in_temp_workspace"])

    def test_tile_visual_derivation_is_metadata_only_and_non_placeholder(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            smooth_path = Path(temp_dir) / "smooth.png"
            ripple_path = Path(temp_dir) / "ripple.png"
            Image.new("L", (OUTPUT_ARTIFACT_DIMENSION, OUTPUT_ARTIFACT_DIMENSION), color=128).save(
                smooth_path,
                format="PNG",
            )

            ripple_image = Image.new("L", (OUTPUT_ARTIFACT_DIMENSION, OUTPUT_ARTIFACT_DIMENSION), color=20)
            ripple_draw = ImageDraw.Draw(ripple_image)
            for y in range(0, OUTPUT_ARTIFACT_DIMENSION, 8):
                ripple_draw.line(
                    [(0, y), (OUTPUT_ARTIFACT_DIMENSION, OUTPUT_ARTIFACT_DIMENSION - y)],
                    fill=250,
                    width=3,
                )
            ripple_image.save(ripple_path, format="PNG")

            smooth_result = derive_tile_visual_style_from_artifact(transformed_path=smooth_path)
            ripple_result = derive_tile_visual_style_from_artifact(transformed_path=ripple_path)

            self.assertEqual(smooth_result.summary["input_stage"], "artistic_transform")
            self.assertFalse(smooth_result.summary["clinical_interpretation_supported"])
            self.assertNotEqual(smooth_result.visual_style, ripple_result.visual_style)
            self.assertNotEqual(smooth_result.render_version, "placeholder-v1")
            self.assertEqual(smooth_result.summary["tile_derivation_version"], TILE_DERIVATION_VERSION)
            self.assertEqual(smooth_result.summary["derivation_family"], DERIVATION_FAMILY)
            self.assertIn("mapping_rule_ids", smooth_result.summary)

    def test_tile_visual_derivation_is_deterministic_and_versioned(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            artifact_path = Path(temp_dir) / "artifact.png"
            artifact = Image.new("L", (OUTPUT_ARTIFACT_DIMENSION, OUTPUT_ARTIFACT_DIMENSION), color=48)
            draw = ImageDraw.Draw(artifact)
            for index in range(0, OUTPUT_ARTIFACT_DIMENSION, 12):
                draw.rectangle(
                    [(index, 0), (min(index + 5, OUTPUT_ARTIFACT_DIMENSION - 1), OUTPUT_ARTIFACT_DIMENSION - 1)],
                    fill=220,
                )
            artifact.save(artifact_path, format="PNG")

            first_result = derive_tile_visual_style_from_artifact(transformed_path=artifact_path)
            second_result = derive_tile_visual_style_from_artifact(transformed_path=artifact_path)

            self.assertEqual(first_result.visual_style, second_result.visual_style)
            self.assertEqual(first_result.render_version, second_result.render_version)
            self.assertEqual(first_result.summary["mapping_rule_ids"], second_result.summary["mapping_rule_ids"])
            self.assertEqual(first_result.summary["tile_derivation_version"], TILE_DERIVATION_VERSION)
            self.assertEqual(MOSAIC_TILE_VERSION, 1)


if __name__ == "__main__":
    unittest.main()
