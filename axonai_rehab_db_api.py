# -*- coding: utf-8 -*-
"""FastAPI router for AxonAI rehab app persistence."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
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
    save_exercise_plan,
    save_feedback,
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


class ExercisePlanPayload(BaseModel):
    patientUserId: str | None = None
    analysisId: str | None = None
    packageKey: str
    plan: dict[str, Any] = Field(default_factory=dict)
    status: str = "pending_therapist_review"


class FeedbackPayload(BaseModel):
    patientUserId: str | None = None
    authorRole: str = "patient"
    category: str = "suggestion"
    message: str
    contactPermission: bool = False
    appContext: dict[str, Any] = Field(default_factory=dict)


class StrokeAssistantPayload(BaseModel):
    question: str
    language: Literal["en", "zh"] = "en"
    patientContext: dict[str, Any] = Field(default_factory=dict)


router = APIRouter(prefix="/api/rehab", tags=["rehab-persistence"])


@router.get("/health")
def health() -> dict[str, Any]:
    try:
        init_db()
        return {"status": "ok", "database": database_status()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database health check failed: {exc}") from exc


def _stroke_assistant_fallback(question: str, language: str) -> str:
    q = question.lower()
    if language == "zh":
        if "痛" in question or "pain" in q:
            return "如果出现尖锐疼痛、新发肩痛、胸痛、头晕或功能突然变差，请立即停止训练并联系医生或康复师。"
        if "累" in question or "疲劳" in question or "fatigue" in q:
            return "卒中后疲劳很常见。建议优先保证动作质量，短时间、多休息，比硬撑到动作变形更安全。"
        return "我可以解释卒中康复基础、居家训练、疲劳、疼痛警示和如何安全使用患侧上肢。涉及诊断、用药、突然加重或急症时，请联系医生或急救服务。"
    if "pain" in q:
        return "If you feel sharp pain, new shoulder pain, chest pain, dizziness, or sudden worsening, stop the exercise and contact a clinician."
    if "tired" in q or "fatigue" in q:
        return "Fatigue is common after stroke. Shorter, cleaner practice is usually safer than pushing through messy movement."
    return "I can explain stroke recovery basics, safe home practice, fatigue, pain warning signs, and affected-arm use. For diagnosis, medication, sudden symptoms, or worsening function, please contact your clinician."


@router.post("/stroke-assistant")
def stroke_assistant(payload: StrokeAssistantPayload) -> dict[str, Any]:
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "answer": _stroke_assistant_fallback(question, payload.language),
            "source": "fallback",
        }

    system_prompt = (
        "You are AxonAI's stroke recovery education assistant. Provide concise, safe, patient-facing "
        "education about stroke rehabilitation, fatigue, pain warning signs, home exercise safety, and "
        "affected-limb use. Do not diagnose, prescribe medication, or replace a clinician. Tell the user "
        "to seek urgent medical care for sudden worsening, chest pain, severe dizziness, or emergency symptoms. "
        "Answer in Chinese when language is zh, otherwise answer in English."
    )
    body = {
        "model": os.getenv("OPENAI_STROKE_ASSISTANT_MODEL", "gpt-4.1-mini"),
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
        "max_output_tokens": 220,
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
        text = data.get("output_text")
        if not text:
            chunks: list[str] = []
            for item in data.get("output", []):
                for content in item.get("content", []):
                    if content.get("type") == "output_text":
                        chunks.append(content.get("text", ""))
            text = "\n".join(chunk for chunk in chunks if chunk).strip()
        return {"answer": text or _stroke_assistant_fallback(question, payload.language), "source": "llm"}
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as exc:
        return {
            "answer": _stroke_assistant_fallback(question, payload.language),
            "source": "fallback",
            "detail": str(exc),
        }


@router.post("/accounts")
def create_account(payload: AuthPayload) -> dict[str, Any]:
    try:
        return create_user(payload.role, payload.identifier, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Account creation failed: {exc}") from exc


@router.post("/login")
def login(payload: AuthPayload) -> dict[str, Any]:
    try:
        return login_user(payload.role, payload.identifier, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Login failed: {exc}") from exc


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


@router.post("/exercise-plans")
def create_exercise_plan(payload: ExercisePlanPayload) -> dict[str, Any]:
    return save_exercise_plan(payload.patientUserId, payload.analysisId, payload.packageKey, payload.plan, payload.status)


@router.post("/matches")
def create_match(payload: MatchPayload) -> dict[str, Any]:
    return save_match(payload.patientUserId, payload.therapistUserId, payload.analysisId, payload.matchedPerson, payload.status)


@router.post("/feedback")
def create_feedback(payload: FeedbackPayload) -> dict[str, Any]:
    try:
        return save_feedback(
            payload.patientUserId,
            payload.authorRole,
            payload.category,
            payload.message,
            payload.contactPermission,
            payload.appContext,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
