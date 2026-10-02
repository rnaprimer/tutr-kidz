# PHASE 26B — EAS PROJECT LINKING & ANDROID PREVIEW BUILD COMPLETION REPORT

**Date:** October 2026  
**Project:** Tutr Kidz  
**Scope:** EAS Project Association, Cloud Environment Variables, EAS Android Preview Build, and APK Generation for Physical Device Testing.

---

## 1. EAS Account Selected

- **Authenticated Expo User:** `rnaprimer` (`debashismohanty5714@gmail.com`)
- **Selected Project Owner:** `rnaprimers-team` (explicitly selected per user instruction)
- **EAS Project Dashboard:** https://expo.dev/accounts/rnaprimers-team/projects/tutr-kidz

---

## 2. EAS Project ID

- **Project ID:** `24e0f3e0-ff66-4232-b79f-6711d07596b0`
- **Configured in `app.json`:** `extra.eas.projectId` and `owner: "rnaprimers-team"`

---

## 3. EAS Configuration Verification (`eas.json`)

The `eas.json` configuration was validated and used for the build:
- **`development`**: `developmentClient: true`, `distribution: internal`
- **`preview`**: `distribution: internal`, `android.buildType: apk` (produces installable `.apk`)
- **`production`**: `autoIncrement: true`, `android.buildType: app-bundle` (for Google Play `.aab`)

---

## 4. Environment Variable Configuration Status

The application requires two public environment variables. Both were pushed to EAS cloud environments (`preview` and `production`):
- `EXPO_PUBLIC_SUPABASE_URL` — **[CONFIGURED]**
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — **[CONFIGURED]**

*(Note: Raw keys and credentials are never checked into git or printed in reports per security protocols).*

---

## 5. Expo Configuration Verification (`npx expo config --type public`)

```json
{
  "name": "Tutr Kidz",
  "slug": "tutr-kidz",
  "scheme": "tutr-kidz",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "light",
  "owner": "rnaprimers-team",
  "sdkVersion": "57.0.0",
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.tutrkidz.app",
    "buildNumber": "1"
  },
  "android": {
    "package": "com.tutrkidz.app",
    "versionCode": 1,
    "adaptiveIcon": {
      "backgroundColor": "#E6F4FE",
      "foregroundImage": "./assets/android-icon-foreground.png",
      "backgroundImage": "./assets/android-icon-background.png",
      "monochromeImage": "./assets/android-icon-monochrome.png"
    },
    "predictiveBackGestureEnabled": false
  },
  "plugins": [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "image": "./assets/splash-icon.png",
        "resizeMode": "contain",
        "backgroundColor": "#FAFAF7"
      }
    ]
  ],
  "extra": {
    "router": {},
    "eas": {
      "projectId": "24e0f3e0-ff66-4232-b79f-6711d07596b0"
    }
  }
}
```

---

## 6. TypeScript Compilation Result

```bash
npx tsc --noEmit
# Exit code: 0 (Zero errors)
```

---

## 7. Expo Doctor Result

```bash
npx expo-doctor
# 21/21 checks passed. No issues detected!
```

---

## 8. Regression Test Results

- `test_native_persistence.js` (Cold Process Restart Lifecycle): **6/6 PASSED**
  - Parent auth session restored across process boundary
  - Child profile and activeChildId restored
  - Progress state, total questions, and topic accuracy restored
  - Parent settings & parent lock restored
  - Offline sync queue preserved and drained idempotently
- `test_phase24.js` (Launch Readiness & Stability): **20/20 PASSED**
- `test_visual_polish.js` (Illustrated UI/UX Design Contracts): **18/18 PASSED**
- All 10–23 Phase suites: **100% PASS**

---

## 9. EAS Android Build Execution

```bash
npx eas-cli build --platform android --profile preview --non-interactive
```

---

## 10. EAS Android Build Metadata

- **Build ID:** `deb0d38c-6194-4a1d-9e97-3e7154258421`
- **Build Status:** **FINISHED (SUCCESS)**
- **Platform:** Android
- **Profile:** `preview`
- **Distribution:** `internal`
- **SDK Version:** `57.0.0`
- **Version:** `1.0.0` (versionCode: `1`)
- **Package ID:** `com.tutrkidz.app`
- **Git Commit:** `60613cef0dc1b0b77adf58d09f9428ed938c9d69`
- **Build Duration:** 13 minutes 35 seconds

---

## 11. APK Artifact Information

- **Direct Download Link (Installable APK):**
  https://expo.dev/artifacts/eas/KcjM_YmBiKhhbvv2XlgFUzlbN__3MkjXOAG6ouBL05I.apk
- **EAS Build Page & QR Code:**
  https://expo.dev/accounts/rnaprimers-team/projects/tutr-kidz/builds/deb0d38c-6194-4a1d-9e97-3e7154258421

---

## 12. Build Warnings & Resolutions

- **Initial Attempt Issue:** The first build failed during `npm ci` because npm strictly enforced lockfile parity between peer dependencies (`expo-modules-core` vs `react-native-reanimated`).
- **Resolution:** Created `.npmrc` with `legacy-peer-deps=true` and synced `package-lock.json`. The subsequent cloud build executed smoothly to completion.
- **Deprecation Notice:** EAS CLI noted that `cli.appVersionSource` will be required in future major CLI releases; defaults to remote source without issue for current build.

---

## 13. Remaining Blockers for Store Release

Zero blockers exist for physical Android device testing.
For final public store submission (separate upcoming release phases):
1. **Google Play Console:** Requires registering an app listing under `com.tutrkidz.app` and running a production build (`eas build --platform android --profile production` to produce `.aab`).
2. **Apple App Store:** Requires Apple Developer credentials to produce an iOS build.
3. **Store Assets:** Feature graphic (1024×500) and device screenshots.

---

## 14. Physical-Device Testing Checklist

Download and install the APK on an Android test device using either the direct URL or by scanning the QR code on the EAS build page:

### AUTH & SESSION
- [ ] Open app → Navigate to Parent Portal (`/parent`) → Solve Parent Lock math challenge.
- [ ] Parent signup with email/password.
- [ ] Parent login with existing account.
- [ ] Force close app (swipe away from recent apps) → Reopen → Verify parent remains signed in without re-authenticating.
- [ ] Test password reset request.
- [ ] Test parent logout.

### FAMILY & MULTI-CHILD ISOLATION
- [ ] Create a learner profile (e.g., "Aarav", Class 1).
- [ ] Create a second learner profile (e.g., "Anya", Class 3).
- [ ] Switch active child between Aarav and Anya.
- [ ] Verify that Aarav's progress and recommendations are completely separate from Anya's.

### LEARNING & PROGRESS PERSISTENCE
- [ ] Enter Toddler activity (colours/shapes) → Confirm qualitative interaction with zero percentages or scores.
- [ ] Enter Class 1/2 Quiz → Answer 5 questions → Reach result screen.
- [ ] Force close the app completely.
- [ ] Reopen app → Check Progress & Parent Insights → Confirm all 5 answered questions and accuracy remain recorded.

### OFFLINE-FIRST OPERATION
- [ ] Enable Airplane Mode on the device (turn off Wi-Fi and Cellular).
- [ ] Launch Tutr Kidz → Observe clean startup without crash or blocking alert.
- [ ] Complete a full 5-question quiz while offline.
- [ ] Force close app while still offline → Reopen app → Verify quiz progress was saved to native `AsyncStorage`.
- [ ] Disable Airplane Mode (reconnect to internet) → Verify offline sync queue automatically uploads progress to Supabase without duplicates.

### UI, UX & NATIVE HARDWARE
- [ ] Splash screen displays smoothly on launch without white screen flash.
- [ ] Portrait orientation is strictly locked during device rotation.
- [ ] Soft keyboard behaves correctly on input screens (Parent Lock PIN, Signup, Onboarding) without obstructing fields.
- [ ] Touch targets feel comfortable and responsive on physical touchscreen (all buttons ≥ 48px).

---

ANDROID PREVIEW BUILD: READY FOR DEVICE TESTING
