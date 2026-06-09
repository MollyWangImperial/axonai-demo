# App Store Release Checklist - English Version

## Required Account Tasks

- Join the Apple Developer Program.
- Create an app record in App Store Connect.
- Use bundle id `com.axonai.neurorehab.en`, or change it to a unique id owned by your Apple team.
- Run `eas init` so Expo writes the real project id into `app.json`.
- Fill `submit.production.ios.ascAppId` in `eas.json` after App Store Connect creates the app.
- Build the iOS app:

```powershell
npm run build:ios:store
```

- Submit to App Store Connect:

```powershell
npm run submit:ios
```

## App Store Page

- App name: AxonAI Rehab
- Subtitle: Stroke movement assessment and training plan
- Category: Medical or Health & Fitness, depending on final positioning.
- Privacy policy URL.
- iPhone screenshots.
- App Review contact information.
- Demo account: not required for the current no-login demo.

## Medical and Privacy Notes

The current prototype records movement videos locally through Expo Go and uses default demo results. A production version with upload, therapist review, OpenSim analysis, or patient accounts will need:

- privacy policy updates
- App Store privacy nutrition label updates
- data deletion process
- medical disclaimer
- therapist review workflow

Avoid describing demo output as diagnosis or treatment replacement.
