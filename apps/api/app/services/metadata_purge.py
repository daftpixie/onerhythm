from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter

from app.api.errors import APIContractError
from app.services.temp_storage import TemporaryUploadWorkspace


@dataclass(frozen=True)
class MetadataPurgeResult:
    sanitized_path: Path
    summary: dict


def purge_source_metadata(
    *,
    workspace: TemporaryUploadWorkspace,
    raw_path: Path,
    upload_format: str,
) -> MetadataPurgeResult:
    if upload_format in {"jpeg", "png"}:
        return _purge_image_metadata(workspace=workspace, raw_path=raw_path, upload_format=upload_format)
    if upload_format == "pdf":
        return _purge_pdf_metadata(workspace=workspace, raw_path=raw_path)

    raise APIContractError(
        code="unsupported_file_type",
        message="Supported upload types are JPEG, PNG, and single-page PDF.",
        status_code=400,
        details={"upload_format": upload_format},
    )


def _purge_image_metadata(
    *,
    workspace: TemporaryUploadWorkspace,
    raw_path: Path,
    upload_format: str,
) -> MetadataPurgeResult:
    sanitized_path = workspace.path_for(f"sanitized.{upload_format}")

    with Image.open(raw_path) as image:
        normalized = image.convert("RGB") if upload_format == "jpeg" else image.copy()
        save_kwargs = {}
        if upload_format == "jpeg":
            save_kwargs = {"format": "JPEG", "quality": 95, "optimize": True}
        else:
            save_kwargs = {"format": "PNG"}
        normalized.save(sanitized_path, **save_kwargs)
        metadata_keys_removed = sorted(image.info.keys())

    return MetadataPurgeResult(
        sanitized_path=sanitized_path,
        summary={
            "stage": "metadata_purge",
            "status": "completed",
            "input_format": upload_format,
            "sanitized_format": upload_format,
            "method": "image_reencode_without_source_metadata",
            "metadata_keys_removed": metadata_keys_removed,
            "hipaa_identifier_controls": [
                "source_filename_not_persisted",
                "image_metadata_removed_before_redaction",
            ],
        },
    )


def _purge_pdf_metadata(
    *,
    workspace: TemporaryUploadWorkspace,
    raw_path: Path,
) -> MetadataPurgeResult:
    sanitized_path = workspace.path_for("sanitized.pdf")
    reader = PdfReader(str(raw_path))
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.add_metadata({})
    with sanitized_path.open("wb") as sanitized_file:
        writer.write(sanitized_file)

    metadata_keys_removed = sorted(reader.metadata.keys()) if reader.metadata else []
    return MetadataPurgeResult(
        sanitized_path=sanitized_path,
        summary={
            "stage": "metadata_purge",
            "status": "completed",
            "input_format": "pdf",
            "sanitized_format": "pdf",
            "method": "pdf_rewrite_without_document_metadata",
            "metadata_keys_removed": metadata_keys_removed,
            "hipaa_identifier_controls": [
                "source_filename_not_persisted",
                "document_metadata_removed_before_redaction",
            ],
        },
    )
