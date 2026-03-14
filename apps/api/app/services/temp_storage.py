from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import json
import os
import shutil
import tempfile
import time
from pathlib import Path

UPLOAD_TMP_ROOT = Path(
    os.getenv("UPLOAD_TMP_ROOT", str(Path(tempfile.gettempdir()) / "onerhythm_uploads"))
)
WORKSPACE_MANIFEST_NAME = "_workspace_manifest.json"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class WorkspaceCleanupReport:
    workspace_removed: bool
    workspace_exists_after_cleanup: bool
    tracked_artifact_labels: list[str]
    artifacts_present_before_cleanup: int
    artifacts_present_after_cleanup: int
    raw_upload_present_before_cleanup: bool
    raw_upload_present_after_cleanup: bool


@dataclass(frozen=True)
class StaleWorkspaceCleanupReport:
    inspected_workspace_count: int
    removed_workspace_count: int


class TemporaryUploadWorkspace:
    def __init__(self, upload_session_id: str) -> None:
        self.upload_session_id = upload_session_id
        UPLOAD_TMP_ROOT.mkdir(parents=True, exist_ok=True)
        self._root = Path(
            tempfile.mkdtemp(
                prefix=f"onerhythm-upload-{upload_session_id}-",
                dir=str(UPLOAD_TMP_ROOT),
            )
        )
        self._artifact_registry: dict[str, Path] = {}
        self._write_manifest()

    @property
    def root(self) -> Path:
        return self._root

    def path_for(self, filename: str, *, artifact_label: str | None = None) -> Path:
        artifact_path = self._root / filename
        if artifact_label is not None:
            self.register_artifact(artifact_label, artifact_path)
        return artifact_path

    def register_artifact(self, artifact_label: str, artifact_path: Path) -> None:
        self._artifact_registry[artifact_label] = artifact_path
        self._write_manifest()

    def cleanup(self) -> WorkspaceCleanupReport:
        tracked_artifact_labels = sorted(self._artifact_registry.keys())
        artifact_presence_before = self._artifact_presence()
        raw_before = artifact_presence_before.get("raw_upload", False)

        if self._root.exists():
            shutil.rmtree(self._root, ignore_errors=True)

        workspace_exists_after_cleanup = self._root.exists()
        artifact_presence_after = self._artifact_presence()
        raw_after = artifact_presence_after.get("raw_upload", False)

        return WorkspaceCleanupReport(
            workspace_removed=not workspace_exists_after_cleanup,
            workspace_exists_after_cleanup=workspace_exists_after_cleanup,
            tracked_artifact_labels=tracked_artifact_labels,
            artifacts_present_before_cleanup=sum(1 for exists in artifact_presence_before.values() if exists),
            artifacts_present_after_cleanup=sum(1 for exists in artifact_presence_after.values() if exists),
            raw_upload_present_before_cleanup=raw_before,
            raw_upload_present_after_cleanup=raw_after,
        )

    def _artifact_presence(self) -> dict[str, bool]:
        return {
            artifact_label: artifact_path.exists()
            for artifact_label, artifact_path in self._artifact_registry.items()
        }

    def _write_manifest(self) -> None:
        manifest_path = self._root / WORKSPACE_MANIFEST_NAME
        manifest_payload = {
            "upload_session_id": self.upload_session_id,
            "created_at": utcnow().isoformat(),
            "artifact_labels": sorted(self._artifact_registry.keys()),
        }
        manifest_path.write_text(json.dumps(manifest_payload, indent=2), encoding="utf-8")

    @classmethod
    def cleanup_stale_workspaces_report(cls, *, max_age_seconds: int) -> StaleWorkspaceCleanupReport:
        if not UPLOAD_TMP_ROOT.exists():
            return StaleWorkspaceCleanupReport(
                inspected_workspace_count=0,
                removed_workspace_count=0,
            )

        now = time.time()
        removed = 0
        inspected = 0
        for candidate in UPLOAD_TMP_ROOT.iterdir():
            if not candidate.is_dir():
                continue
            inspected += 1
            age_seconds = now - candidate.stat().st_mtime
            if age_seconds <= max_age_seconds:
                continue
            shutil.rmtree(candidate, ignore_errors=True)
            if not candidate.exists():
                removed += 1

        return StaleWorkspaceCleanupReport(
            inspected_workspace_count=inspected,
            removed_workspace_count=removed,
        )

    @classmethod
    def cleanup_stale_workspaces(cls, *, max_age_seconds: int) -> int:
        return cls.cleanup_stale_workspaces_report(
            max_age_seconds=max_age_seconds
        ).removed_workspace_count


def cleanup_report_to_dict(report: WorkspaceCleanupReport) -> dict:
    return asdict(report)


def stale_cleanup_report_to_dict(report: StaleWorkspaceCleanupReport) -> dict:
    return asdict(report)
