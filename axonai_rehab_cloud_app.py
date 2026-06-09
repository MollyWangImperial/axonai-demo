# -*- coding: utf-8 -*-
"""Cloud-ready FastAPI entrypoint for the AxonAI rehab app.

Run locally:

    uvicorn axonai_rehab_cloud_app:app --host 0.0.0.0 --port 8020

This app intentionally mounts only the English rehab app APIs:
account/profile persistence, upper-limb video analysis, and plan generation.
It avoids importing the larger OpenCap experimental pipeline used by main.py.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from axonai_rehab_db_api import router as rehab_db_router
from rehab_packages_api import router as rehab_packages_router
from upper_limb_rehab_api import router as upper_limb_rehab_router


app = FastAPI(title="AxonAI Rehab Cloud API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(rehab_db_router)
app.include_router(upper_limb_rehab_router)
app.include_router(rehab_packages_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "axonai-rehab-cloud-api"}
