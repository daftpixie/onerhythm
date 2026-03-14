from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import hashlib
from pathlib import Path
from typing import Protocol

import numpy as np
from PIL import Image, ImageFilter, ImageOps
import pypdfium2 as pdfium

PDF_RENDER_SCALE = 2.0
NORMALIZED_INPUT_DIMENSION = 64
COARSE_GRID_DIMENSION = 18
OUTPUT_ARTIFACT_DIMENSION = 96
QUANTIZATION_LEVELS = 5
MIRROR_BLEND_WEIGHT = 0.35
VERTICAL_BLEND_WEIGHT = 0.15
BLUR_RADIUS = 4
RENDER_VERSION = "artistic-abstract-v1"
TILE_DERIVATION_VERSION = "tile-visual-derivation-v1"
MOSAIC_TILE_VERSION = 1
DERIVATION_FAMILY = "artistic_metadata_only"

SIGNAL_COLOR_GRADIENT_THRESHOLD = 0.12
AURORA_COLOR_SYMMETRY_THRESHOLD = 0.08
SMOOTH_TEXTURE_CONTRAST_THRESHOLD = 0.09
GRAIN_TEXTURE_SYMMETRY_THRESHOLD = 0.12
BRIGHT_GLOW_LUMINANCE_THRESHOLD = 0.58
BRIGHT_GLOW_GRADIENT_THRESHOLD = 0.15
SUBTLE_GLOW_LUMINANCE_THRESHOLD = 0.36
SUBTLE_GLOW_CONTRAST_THRESHOLD = 0.11
OPACITY_BASE = 0.58
OPACITY_CONTRAST_WEIGHT = 1.1
OPACITY_GRADIENT_WEIGHT = 0.8
OPACITY_MIN = 0.55
OPACITY_MAX = 0.92


@dataclass(frozen=True)
class ArtisticTransformResult:
    transformed_path: Path
    summary: dict


@dataclass(frozen=True)
class TileVisualDerivationResult:
    visual_style: dict
    render_version: str
    summary: dict


class ArtisticTransformError(RuntimeError):
    def __init__(self, *, summary: dict) -> None:
        super().__init__("The artistic transform stage failed.")
        self.summary = summary


class ArtisticTransformService(Protocol):
    @property
    def provider_name(self) -> str:
        ...

    def transform(self, *, source_path: Path, upload_format: str) -> ArtisticTransformResult:
        ...


class LowFidelityArtisticTransformService:
    @property
    def provider_name(self) -> str:
        return "low_fidelity_artistic_transform"

    def transform(self, *, source_path: Path, upload_format: str) -> ArtisticTransformResult:
        report = {
            "stage": "artistic_transform",
            "status": "not_started",
            "provider": self.provider_name,
            "provider_version": "v1",
            "source_stage": "ocr_redaction",
            "input_format": upload_format,
            "output_format": "png",
            "artifact_kind": "abstract_luminance_field",
            "clinical_interpretation_supported": False,
            "biometric_fidelity_preserved": False,
            "derived_artifact_retained_only_in_temp_workspace": True,
            "destructive_transform_steps": [
                "grayscale_projection",
                "square_normalization",
                "gaussian_blur",
                "coarse_downsample",
                "mirror_blend",
                "quantization",
                "nearest_neighbor_upscale",
            ],
        }
        failure_stage = "load_input"
        try:
            input_image = _load_source_image(source_path=source_path, upload_format=upload_format)
            report["source_dimensions"] = [input_image.width, input_image.height]

            failure_stage = "transform"
            transformed_image, stats = _build_abstract_artifact(input_image)
            transformed_path = source_path.with_name(f"{source_path.stem}.artistic.png")
            transformed_image.save(transformed_path, format="PNG")
            artifact_bytes = transformed_path.read_bytes()
            report["status"] = "completed"
            report["output_dimensions"] = [transformed_image.width, transformed_image.height]
            report["coarse_grid_dimensions"] = [COARSE_GRID_DIMENSION, COARSE_GRID_DIMENSION]
            report["quantization_levels"] = QUANTIZATION_LEVELS
            report["artifact_checksum_sha256"] = hashlib.sha256(artifact_bytes).hexdigest()
            report["artifact_statistics"] = stats
            return ArtisticTransformResult(
                transformed_path=transformed_path,
                summary=report,
            )
        except ArtisticTransformError:
            raise
        except Exception as exc:
            report["status"] = "failed"
            report["failure_stage"] = failure_stage
            report["failure_reason"] = exc.__class__.__name__
            raise ArtisticTransformError(summary=report) from exc


def _load_source_image(*, source_path: Path, upload_format: str) -> Image.Image:
    if upload_format in {"jpeg", "png"}:
        with Image.open(source_path) as image:
            return image.convert("RGB")

    if upload_format != "pdf":
        raise ValueError(f"Unsupported upload format: {upload_format}")

    document = pdfium.PdfDocument(str(source_path))
    try:
        page = document[0]
        rendered = page.render(scale=PDF_RENDER_SCALE)
        return rendered.to_pil().convert("RGB")
    finally:
        document.close()


def _build_abstract_artifact(source_image: Image.Image) -> tuple[Image.Image, dict]:
    grayscale = ImageOps.grayscale(source_image)
    normalized = ImageOps.fit(
        grayscale,
        (NORMALIZED_INPUT_DIMENSION, NORMALIZED_INPUT_DIMENSION),
        method=Image.Resampling.BILINEAR,
    )
    blurred = normalized.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))
    coarse = blurred.resize(
        (COARSE_GRID_DIMENSION, COARSE_GRID_DIMENSION),
        Image.Resampling.BILINEAR,
    )
    coarse_array = np.asarray(coarse, dtype=np.float32) / 255.0
    blended = (
        coarse_array
        + (np.fliplr(coarse_array) * MIRROR_BLEND_WEIGHT)
        + (np.flipud(coarse_array) * VERTICAL_BLEND_WEIGHT)
    ) / (1 + MIRROR_BLEND_WEIGHT + VERTICAL_BLEND_WEIGHT)
    abstract_array = _quantize_array(_normalize_array(blended), levels=QUANTIZATION_LEVELS)
    artifact_image = Image.fromarray((abstract_array * 255).astype(np.uint8)).resize(
        (OUTPUT_ARTIFACT_DIMENSION, OUTPUT_ARTIFACT_DIMENSION),
        Image.Resampling.NEAREST,
    )
    return artifact_image, _artifact_statistics(abstract_array)


def _normalize_array(values: np.ndarray) -> np.ndarray:
    minimum = float(values.min())
    maximum = float(values.max())
    if maximum - minimum <= 1e-6:
        return np.zeros_like(values)
    return (values - minimum) / (maximum - minimum)


def _quantize_array(values: np.ndarray, *, levels: int) -> np.ndarray:
    if levels < 2:
        raise ValueError("levels must be at least 2")
    return np.round(values * (levels - 1)) / (levels - 1)


def _artifact_statistics(values: np.ndarray) -> dict:
    horizontal_energy = _gradient_energy(values, axis=1)
    vertical_energy = _gradient_energy(values, axis=0)
    symmetry_delta = float(np.abs(values - np.fliplr(values)).mean())
    return {
        "mean_luminance": round(float(values.mean()), 4),
        "contrast": round(float(values.std()), 4),
        "gradient_energy": round((horizontal_energy + vertical_energy) / 2, 4),
        "symmetry_delta": round(symmetry_delta, 4),
        "unique_level_count": int(np.unique(values).size),
    }


def _gradient_energy(values: np.ndarray, *, axis: int) -> float:
    if values.shape[axis] <= 1:
        return 0.0
    return float(np.abs(np.diff(values, axis=axis)).mean())


def derive_tile_visual_style_from_artifact(
    *,
    transformed_path: Path,
) -> TileVisualDerivationResult:
    with Image.open(transformed_path) as image:
        artifact = np.asarray(image.convert("L"), dtype=np.float32) / 255.0

    stats = _artifact_statistics(artifact)
    mean_luminance = stats["mean_luminance"]
    contrast = stats["contrast"]
    gradient_energy = stats["gradient_energy"]
    symmetry_delta = stats["symmetry_delta"]

    color_family, color_rule = _derive_color_family(
        gradient_energy=gradient_energy,
        symmetry_delta=symmetry_delta,
    )
    texture_kind, texture_rule = _derive_texture_kind(
        contrast=contrast,
        symmetry_delta=symmetry_delta,
    )
    glow_level, glow_rule = _derive_glow_level(
        mean_luminance=mean_luminance,
        contrast=contrast,
        gradient_energy=gradient_energy,
    )
    opacity, opacity_rule = _derive_opacity(
        contrast=contrast,
        gradient_energy=gradient_energy,
    )
    visual_style = {
        "color_family": color_family,
        "opacity": opacity,
        "texture_kind": texture_kind,
        "glow_level": glow_level,
    }
    summary = {
        "stage": "tile_visual_derivation",
        "status": "completed",
        "input_stage": "artistic_transform",
        "render_version": RENDER_VERSION,
        "tile_derivation_version": TILE_DERIVATION_VERSION,
        "derivation_family": DERIVATION_FAMILY,
        "artifact_statistics": stats,
        "visual_style": visual_style,
        "mapping_rule_ids": {
            "color_family": color_rule,
            "texture_kind": texture_rule,
            "glow_level": glow_rule,
            "opacity": opacity_rule,
        },
        "clinical_interpretation_supported": False,
    }
    return TileVisualDerivationResult(
        visual_style=visual_style,
        render_version=RENDER_VERSION,
        summary=summary,
    )


def _derive_color_family(*, gradient_energy: float, symmetry_delta: float) -> tuple[str, str]:
    if gradient_energy >= SIGNAL_COLOR_GRADIENT_THRESHOLD:
        return "signal", "gradient_energy_high_signal_v1"
    if symmetry_delta <= AURORA_COLOR_SYMMETRY_THRESHOLD:
        return "aurora", "symmetry_low_aurora_v1"
    return "pulse", "default_pulse_v1"


def _derive_texture_kind(*, contrast: float, symmetry_delta: float) -> tuple[str, str]:
    if contrast <= SMOOTH_TEXTURE_CONTRAST_THRESHOLD:
        return "smooth", "contrast_low_smooth_v1"
    if symmetry_delta <= GRAIN_TEXTURE_SYMMETRY_THRESHOLD:
        return "grain", "symmetry_low_grain_v1"
    return "ripple", "default_ripple_v1"


def _derive_glow_level(
    *,
    mean_luminance: float,
    contrast: float,
    gradient_energy: float,
) -> tuple[str, str]:
    if (
        mean_luminance >= BRIGHT_GLOW_LUMINANCE_THRESHOLD
        or gradient_energy >= BRIGHT_GLOW_GRADIENT_THRESHOLD
    ):
        return "bright", "high_luminance_or_gradient_bright_v1"
    if (
        mean_luminance >= SUBTLE_GLOW_LUMINANCE_THRESHOLD
        or contrast >= SUBTLE_GLOW_CONTRAST_THRESHOLD
    ):
        return "subtle", "moderate_luminance_or_contrast_subtle_v1"
    return "none", "default_none_v1"


def _derive_opacity(*, contrast: float, gradient_energy: float) -> tuple[float, str]:
    value = _clamp(
        OPACITY_BASE
        + (contrast * OPACITY_CONTRAST_WEIGHT)
        + (gradient_energy * OPACITY_GRADIENT_WEIGHT),
        OPACITY_MIN,
        OPACITY_MAX,
    )
    return round(value, 2), "clamped_contrast_gradient_mix_v1"


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


@lru_cache(maxsize=1)
def build_default_artistic_transform_service() -> ArtisticTransformService:
    return LowFidelityArtisticTransformService()
