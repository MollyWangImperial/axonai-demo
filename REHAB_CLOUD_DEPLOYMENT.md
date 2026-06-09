# AxonAI Rehab Cloud Deployment

This deployment path keeps source code in GitHub and keeps patient data/videos
out of the repository.

## Backend Service

Entrypoint:

```bash
uvicorn axonai_rehab_cloud_app:app --host 0.0.0.0 --port $PORT
```

Render can use `render.yaml` from this branch.

## Required Production Services

1. Supabase Postgres or another managed Postgres database.
2. S3-compatible object storage for videos.
   - AWS S3 works.
   - Supabase Storage S3-compatible access works if enabled in Supabase.

## Environment Variables

Database:

```text
DATABASE_URL=postgresql://...
```

Temporary local analysis storage:

```text
AXONAI_UPLOAD_ROOT=/tmp/axonai/uploads/upper_limb_package
AXONAI_KEEP_UPLOADED_VIDEOS=false
```

Object storage:

```text
AXONAI_OBJECT_STORAGE_BUCKET=...
AXONAI_OBJECT_STORAGE_ENDPOINT_URL=...
AXONAI_OBJECT_STORAGE_REGION=...
AXONAI_OBJECT_STORAGE_ACCESS_KEY_ID=...
AXONAI_OBJECT_STORAGE_SECRET_ACCESS_KEY=...
AXONAI_OBJECT_STORAGE_PUBLIC_BASE_URL=...
```

If object storage is configured, uploaded videos are copied to the bucket before
the temporary analysis copy is deleted. If object storage is not configured,
the API still analyzes videos but does not retain them after analysis unless
`AXONAI_KEEP_UPLOADED_VIDEOS=true`.

## Health Checks

```text
GET /health
GET /api/rehab/health
GET /api/upper-limb/health
```

`/api/rehab/health` reports whether the backend is using `sqlite` or
`postgres`.

## App Configuration

Set the English Expo app environment variable to the deployed backend URL:

```text
EXPO_PUBLIC_AXONAI_API_URL=https://your-rehab-api-host
```
