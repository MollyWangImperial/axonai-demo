# -*- coding: utf-8 -*-
"""FastAPI router for AxonAI rehab app persistence."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from axonai_rehab_db import (
    create_user,
    database_status,
    get_profile,
    init_db,
    list_therapists,
    login_user,
    save_analysis,
    save_match,
    save_package_analysis,
    save_profile,
)


Role = Literal["patient", "therapist"]


class AuthPayload(BaseModel):
    role: Role
    identifier: str
    password: str


class ProfilePayload(BaseModel):
    userId: str
    role: Role
    profile: dict[str, Any] = Field(default_factory=dict)


class AnalysisPayload(BaseModel):
    patientUserId: str | None = None
    patientProfile: dict[str, Any] = Field(default_factory=dict)
    recordedVideos: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)


class PackageAnalysisPayload(AnalysisPayload):
    packageKey: str


class MatchPayload(BaseModel):
    patientUserId: str | None = None
    therapistUserId: str | None = None
    analysisId: str | None = None
    matchedPerson: dict[str, Any] = Field(default_factory=dict)
    status: str = "waiting_for_therapist"


router = APIRouter(prefix="/api/rehab", tags=["rehab-persistence"])


@router.get("/health")
def health() -> dict[str, Any]:
    try:
        init_db()
        return {"status": "ok", "database": database_status()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database health check failed: {exc}") from exc


@router.post("/accounts")
def create_account(payload: AuthPayload) -> dict[str, Any]:
    try:
        return create_user(payload.role, payload.identifier, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login")
def login(payload: AuthPayload) -> dict[str, Any]:
    try:
        return login_user(payload.role, payload.identifier, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/profiles")
def upsert_profile(payload: ProfilePayload) -> dict[str, Any]:
    try:
        return save_profile(payload.userId, payload.role, payload.profile)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/profiles/{role}/{user_id}")
def read_profile(role: Role, user_id: str) -> dict[str, Any]:
    profile = get_profile(user_id, role)
    if profile is None:
        raise HTTPException(status_code=404, detail="profile not found")
    return {"userId": user_id, "role": role, "profile": profile}


@router.get("/therapists")
def therapists() -> dict[str, Any]:
    return {"therapists": list_therapists()}


@router.post("/upper-limb-analyses")
def create_upper_limb_analysis(payload: AnalysisPayload) -> dict[str, Any]:
    return save_analysis(payload.patientUserId, payload.patientProfile, payload.recordedVideos, payload.result)


@router.post("/package-analyses")
def create_package_analysis(payload: PackageAnalysisPayload) -> dict[str, Any]:
    return save_package_analysis(payload.packageKey, payload.patientUserId, payload.patientProfile, payload.recordedVideos, payload.result)


@router.post("/matches")
def create_match(payload: MatchPayload) -> dict[str, Any]:
    return save_match(payload.patientUserId, payload.therapistUserId, payload.analysisId, payload.matchedPerson, payload.status)
