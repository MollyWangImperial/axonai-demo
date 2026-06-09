# AxonAI Rehab iPhone App - English Version

This is a separate Expo / React Native iPhone app prototype:

`E:\AxonAIRepo\axonai_vps\axonai_rehab_ios_app_en`

## Current Scope

- English UI.
- Five functional package entries:
  - Upper Limb Package
  - Hand Function Package
  - Gait Package
  - Balance Package
  - Trunk Control Package
- Only the Upper Limb Package is fully active in this demo.
- Patient and therapist account entry flows save to the backend SQLite database.
- The upper-limb flow includes:
  - patient onboarding
  - therapist onboarding
  - live camera collection
  - video quality confirmation
  - backend-connected upper-limb analysis request using uploaded videos
  - functional problem summary
  - weekly training plan from backend/fallback result
  - exercise demonstration
  - AXONAI therapist matching
  - matched therapist profile
  - saved match request and waiting for therapist response

## Not Included Yet

- Production authentication.
- Cloud upload.
- Encrypted clinical data storage and audit logs.
- Production therapist verification.

The app calls the backend upper-limb endpoint when generating a plan. The backend supports the deterministic rehab reasoning algorithm plus first-pass MediaPipe/OpenCV metric extraction for all upper-limb package videos. The backend also persists patient accounts, therapist accounts, profiles, upper-limb analysis results, and match requests.

## Local Database

The backend creates a SQLite database at:

```text
E:\AxonAIRepo\axonai_vps\axonai_rehab_runtime\axonai_rehab.sqlite3
```

Override the path with:

```powershell
$env:AXONAI_REHAB_DB_PATH="D:\AxonAIData\axonai_rehab.sqlite3"
```

Database-backed endpoints:

- `POST /api/rehab/accounts`
- `POST /api/rehab/login`
- `POST /api/rehab/profiles`
- `GET /api/rehab/therapists`
- `POST /api/rehab/upper-limb-analyses`
- `POST /api/rehab/matches`

## Run Backend API

```powershell
cd E:\AxonAIRepo\axonai_vps
python -m pip install fastapi "uvicorn[standard]" python-multipart mediapipe==0.10.14 opensim==4.6 python-decouple
python -m uvicorn axonai_rehab_cloud_app:app --host 0.0.0.0 --port 8020
```

Health check:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8020/api/upper-limb/health
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8020/api/rehab/health
```

## Run on iPhone with Expo Go

Create `.env` from `.env.example` and set `EXPO_PUBLIC_AXONAI_API_URL` to your computer's LAN IP, not `127.0.0.1`. Example:

```text
EXPO_PUBLIC_AXONAI_API_URL=http://172.16.1.22:8020
```

```powershell
cd E:\AxonAIRepo\axonai_vps\axonai_rehab_ios_app_en
npm install
npx expo start --clear
```

Open Expo Go on your iPhone and scan the QR code.

## Checks

```powershell
npm run typecheck
npx expo install --check
```

## App Store Notes

This project is configured as a separate English app:

- iOS bundle id: `com.axonai.neurorehab.en`
- Android package: `com.axonai.neurorehab.en`
- Expo slug: `axonai-rehab-ios-app-en`

To submit to App Store Connect, you still need an Apple Developer account, App Store Connect app record, EAS setup, privacy policy, screenshots, and Apple review approval.
