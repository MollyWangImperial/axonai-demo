# Supabase Setup for AxonAI Rehab

Codex currently does not have a callable Supabase MCP project-creation tool in
this workspace. The setup below is therefore prepared as SQL and environment
configuration that you can run in the Supabase dashboard.

## 1. Create Project

In Supabase:

1. Create a new project.
2. Choose a region close to your Render backend and expected users.
3. Save the database password in a password manager.

## 2. Run Schema, RLS, and Storage Setup

Open Supabase SQL Editor and run:

```sql
-- paste contents of:
-- supabase/axonai_rehab_schema.sql
```

This creates:

- Patient, therapist, analysis, exercise-plan, match, review, and video metadata tables.
- Row Level Security policies.
- A private Storage bucket named `axonai-rehab-videos`.
- Storage policies for private patient-owned video paths.

The video object path convention is:

```text
{patient_user_id}/{package_key}/{action_id}/{filename}
```

This lets Storage RLS check whether the authenticated user owns the first folder
or is an assigned therapist for that patient.

## 3. Enable Auth

Use Supabase Auth for production. Email/password is enough for the first MVP.

Recommended settings:

- Disable public anonymous access to patient data through RLS. The SQL already
  targets `authenticated` users.
- Configure Site URL and redirect URLs once the app/backend URLs are final.
- Keep the service-role key only on the backend. Never put it in Expo.

## 4. Environment Variables

Copy `.env.supabase.example` and fill values from:

- Supabase Project Settings > API
- Supabase Project Settings > Database
- Supabase Storage S3 access settings if you use the existing S3 upload adapter

Render needs at minimum:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AXONAI_UPLOAD_ROOT=/tmp/axonai/uploads
AXONAI_KEEP_UPLOADED_VIDEOS=false
```

Expo needs:

```text
EXPO_PUBLIC_AXONAI_API_URL=https://YOUR_RENDER_SERVICE.onrender.com
SUPABASE_URL
SUPABASE_ANON_KEY
```

Only the anon key may be used in the app. The service-role key must stay server-side.

## 5. Storage Access

The bucket is private. Patients can upload/read/delete objects under their own
user-id folder. Assigned therapists can read patient videos after a care match is
created.

If the backend uploads videos using Supabase service-role credentials, it can
bypass RLS. That is acceptable for backend-only analysis, but the app should still
use normal authenticated user access for direct client uploads.

## 6. What Still Needs Integration

The current backend can connect to Supabase Postgres through `DATABASE_URL`.
Before real production launch, the app should be migrated from prototype auth to
Supabase Auth so `auth.uid()` policies protect patient data end to end.

Recommended next engineering tasks:

1. Replace prototype account APIs in the Expo app with Supabase Auth.
2. Save patient and therapist profiles directly to Supabase tables.
3. Upload videos to `axonai-rehab-videos` using the path convention above.
4. Store `uploaded_videos` metadata after each successful upload.
5. Save package analysis and exercise plan rows after analysis.
6. Add therapist dashboard queries scoped by `care_matches`.

## References

- Supabase RLS:
  https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage buckets:
  https://supabase.com/docs/guides/storage/buckets/creating-buckets
- Supabase Storage access control:
  https://supabase.com/docs/guides/storage/security/access-control
