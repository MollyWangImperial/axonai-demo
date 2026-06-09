# -*- coding: utf-8 -*-
"""FastAPI router for non-upper-limb rehab package analysis.

The first production-ready path for these packages accepts measured metrics
from the app/video pipeline. Package-specific video extractors can be added
behind the same request shape later.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from rehab_packages_algorithm import PACKAGE_DEFINITIONS, evaluate_package_collection, sample_manifest


PackageKey = Literal["hand", "gait", "balance", "trunk"]


class PackageActionRecord(BaseModel):
    path: str | None = None
    uri: str | None = None
    filename: str | None = None
    measuredMetrics: dict[str, Any] = Field(default_factory=dict)
    quality: dict[str, Any] = Field(default_factory=dict)


class PackageAnalyzeRequest(BaseModel):
    patientProfile: dict[str, Any] = Field(default_factory=dict)
    actions: dict[str, PackageActionRecord] = Field(default_factory=dict)
    savedFiles: dict[str, PackageActionRecord] = Field(default_factory=dict)
    measuredMetrics: dict[str, dict[str, Any]] = Field(default_factory=dict)


router = APIRouter(prefix="/api/rehab-packages", tags=["rehab-packages"])


@router.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "packages": {
            key: {
                "title": definition.title,
                "algorithmVersion": f"{key}-package-v1.0",
                "requiredActions": definition.actions,
            }
            for key, definition in PACKAGE_DEFINITIONS.items()
        },
    }


@router.get("/{package_key}/sample")
def package_sample(package_key: PackageKey) -> dict[str, Any]:
    return evaluate_package_collection(package_key, sample_manifest(package_key))


@router.post("/{package_key}/analyze")
def analyze_package(package_key: PackageKey, payload: PackageAnalyzeRequest) -> dict[str, Any]:
    try:
        definition = PACKAGE_DEFINITIONS[package_key]
        source_records = payload.actions or payload.savedFiles
        actions: dict[str, Any] = {}
        for action_id in definition.actions:
            record_model = source_records.get(action_id)
            record = record_model.model_dump() if record_model else {}
            if not record.get("path") and str(record.get("uri", "")).startswith("file://"):
                record["path"] = str(record["uri"]).replace("file://", "", 1)
            if action_id in payload.measuredMetrics:
                record["measuredMetrics"] = payload.measuredMetrics[action_id]
            actions[action_id] = record

        manifest = {
            "patientProfile": payload.patientProfile,
            "actions": actions,
        }
        return evaluate_package_collection(package_key, manifest)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown package: {package_key}") from exc
    except Exception as exc:  # pragma: no cover - defensive API boundary
        raise HTTPException(status_code=500, detail=f"{package_key} analysis failed: {exc}") from exc
