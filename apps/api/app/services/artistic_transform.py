from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import hashlib
import math
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
WAVEFORM_SIGNATURE_VERSION = "redacted_waveform_profile_v1"
WAVEFORM_SIGNATURE_BAND_COUNT = 3
WAVEFORM_SIGNATURE_POINT_COUNT = 24
WAVEFORM_SIGNATURE_SIDE_MARGIN_RATIO = 0.03
WAVEFORM_SIGNATURE_TOP_MARGIN_RATIO = 0.12
WAVEFORM_SIGNATURE_BOTTOM_MARGIN_RATIO = 0.08


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
            input_image = load_source_image(source_path=source_path, upload_format=upload_format)
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


def load_source_image(*, source_path: Path, upload_format: str) -> Image.Image:
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
    source_path: Path | None = None,
    source_upload_format: str | None = None,
    attribution: dict | None = None,
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
    waveform_signature: dict | None = None
    waveform_signature_summary = {
        "status": "not_requested",
        "source": WAVEFORM_SIGNATURE_VERSION,
        "band_count": 0,
        "points_per_band": 0,
    }
    if source_path is not None and source_upload_format is not None:
        try:
            waveform_signature = derive_waveform_signature_from_source(
                source_path=source_path,
                upload_format=source_upload_format,
            )
            waveform_signature_summary = {
                "status": "completed",
                "source": waveform_signature["source"],
                "band_count": len(waveform_signature["bands"]),
                "points_per_band": len(waveform_signature["bands"][0]["points"])
                if waveform_signature["bands"]
                else 0,
            }
        except Exception as exc:
            waveform_signature_summary = {
                "status": "failed",
                "source": WAVEFORM_SIGNATURE_VERSION,
                "failure_reason": exc.__class__.__name__,
                "band_count": 0,
                "points_per_band": 0,
            }
    visual_style = {
        "color_family": color_family,
        "opacity": opacity,
        "texture_kind": texture_kind,
        "glow_level": glow_level,
    }
    if waveform_signature is not None:
        visual_style["waveform_signature"] = waveform_signature
    if attribution:
        visual_style["attribution"] = attribution
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
        "waveform_signature": waveform_signature_summary,
        "attribution": {
            "status": "included" if attribution else "not_included",
            "name_present": bool((attribution or {}).get("contributor_name")),
            "location_present": bool((attribution or {}).get("contributor_location")),
        },
        "clinical_interpretation_supported": False,
    }
    return TileVisualDerivationResult(
        visual_style=visual_style,
        render_version=RENDER_VERSION,
        summary=summary,
    )


def derive_waveform_signature_from_source(
    *,
    source_path: Path,
    upload_format: str,
) -> dict:
    source_image = load_source_image(source_path=source_path, upload_format=upload_format)
    grayscale = ImageOps.grayscale(source_image).filter(ImageFilter.GaussianBlur(radius=1.4))
    width, height = grayscale.size

    left = int(width * WAVEFORM_SIGNATURE_SIDE_MARGIN_RATIO)
    right = max(int(width * (1 - WAVEFORM_SIGNATURE_SIDE_MARGIN_RATIO)), left + 2)
    top = int(height * WAVEFORM_SIGNATURE_TOP_MARGIN_RATIO)
    bottom = max(int(height * (1 - WAVEFORM_SIGNATURE_BOTTOM_MARGIN_RATIO)), top + 2)
    cropped = grayscale.crop((left, top, right, bottom))
    waveform = np.asarray(cropped, dtype=np.float32) / 255.0
    darkness = 1.0 - waveform

    bands: list[dict] = []
    for band_index in range(WAVEFORM_SIGNATURE_BAND_COUNT):
        band_top = int(round((band_index / WAVEFORM_SIGNATURE_BAND_COUNT) * darkness.shape[0]))
        band_bottom = int(
            round(((band_index + 1) / WAVEFORM_SIGNATURE_BAND_COUNT) * darkness.shape[0])
        )
        band = darkness[band_top:band_bottom, :]
        if band.size == 0:
            continue
        points, emphasis = _extract_waveform_band_signature(
            band,
            band_index=band_index,
        )
        bands.append(
            {
                "points": points,
                "emphasis": emphasis,
            }
        )

    return {
        "source": WAVEFORM_SIGNATURE_VERSION,
        "bands": bands,
    }


def _extract_waveform_band_signature(
    band: np.ndarray,
    *,
    band_index: int,
) -> tuple[list[dict[str, float]], float]:
    height, width = band.shape
    if height <= 0 or width <= 0:
        return [], 0.35

    values: list[float] = []
    energies: list[float] = []
    for point_index in range(WAVEFORM_SIGNATURE_POINT_COUNT):
        left = int(round((point_index / WAVEFORM_SIGNATURE_POINT_COUNT) * width))
        right = int(round(((point_index + 1) / WAVEFORM_SIGNATURE_POINT_COUNT) * width))
        if right <= left:
            right = min(left + 1, width)
        column_window = band[:, left:right]
        column = column_window.mean(axis=1)
        baseline = float(np.quantile(column, 0.66))
        weights = np.clip(column - baseline, 0.0, None)
        if float(weights.sum()) <= 1e-6:
            values.append(0.5)
            energies.append(0.0)
            continue

        row_positions = np.linspace(0.0, 1.0, num=height, endpoint=False) + (0.5 / height)
        centroid = float(np.dot(row_positions, weights) / weights.sum())
        values.append(centroid)
        energies.append(float(weights.mean()))

    smoothed = _smooth_series(values, radius=2)
    stylized = _stylize_waveform_profile(smoothed, band_index=band_index)
    amplitude = max(stylized) - min(stylized) if stylized else 0.0
    emphasis = round(_clamp(0.38 + (amplitude * 2.1) + (sum(energies) / max(len(energies), 1)), 0.35, 0.94), 2)
    point_denominator = max(len(stylized) - 1, 1)
    points = [
        {
            "x": round(index / point_denominator, 4),
            "y": round(value, 4),
        }
        for index, value in enumerate(stylized)
    ]
    return points, emphasis


def _smooth_series(values: list[float], *, radius: int) -> list[float]:
    if not values:
        return []
    smoothed: list[float] = []
    for index in range(len(values)):
        left = max(index - radius, 0)
        right = min(index + radius + 1, len(values))
        window = values[left:right]
        smoothed.append(sum(window) / len(window))
    return smoothed


def _stylize_waveform_profile(values: list[float], *, band_index: int) -> list[float]:
    if not values:
        return []
    stylized: list[float] = []
    for index, value in enumerate(values):
        accent = math.sin((index * 0.72) + (band_index * 0.9)) * 0.028
        stylized.append(_clamp(0.5 + ((value - 0.5) * 0.78) + accent, 0.08, 0.92))
    return stylized


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
