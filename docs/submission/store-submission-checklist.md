# Pomoodle Store Submission Checklist

## Before Building

- [ ] Merge all release PRs into `main`
- [ ] Run latest `supabase/schema.sql` in Supabase SQL Editor
- [ ] Verify Supabase Auth providers enabled (Email, Google)
- [ ] Verify Supabase redirect URL includes `pomoodle://login`
- [ ] Verify legal pages are live:
  - [ ] Privacy Policy (`https://ethphan.github.io/pomoodle/privacy/`)
  - [ ] Terms (`https://ethphan.github.io/pomoodle/terms/`)
  - [ ] Account Deletion (`https://ethphan.github.io/pomoodle/delete-account/`)

## App Config

- [ ] `app.json` bundle/package identifiers are correct
  - iOS: `com.ethanphan.pomoodle`
  - Android: `com.ethanphan.pomoodle`
- [ ] `ios.buildNumber` incremented for each iOS resubmission
- [ ] `android.versionCode` incremented for each Android resubmission
- [ ] App icon and splash assets look correct on device

## EAS Builds

- [ ] iOS preview build installs on iPhone
- [ ] Android preview build installs on device
- [ ] Production builds succeed (`eas build -p ios/android --profile production`)

## Real Device QA (Required)

- [ ] Email sign up
- [ ] Email sign in
- [ ] Google sign in (success path)
- [ ] Google sign in (cancel path)
- [ ] Sign out
- [ ] Create Pomodoro
- [ ] Start / Pause / Resume / Cancel Pomodoro
- [ ] Completion notification while app backgrounded/phone locked
- [ ] Stats page: day / week / month / year
- [ ] Stats boundary check near local midnight
- [ ] Delete account (Settings -> Delete account -> Confirm)

## App Store Connect (iOS)

- [ ] App name / subtitle
- [ ] Description / keywords
- [ ] Screenshots (required device sizes)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] App Privacy questionnaire completed
- [ ] Account deletion availability confirmed in app

## Google Play Console (Android)

- [ ] App name / short description / full description
- [ ] Screenshots + feature graphic
- [ ] Privacy Policy URL
- [ ] Data safety form completed
- [ ] App access instructions (if reviewer needs sign-in)
- [ ] Content rating completed
- [ ] Target audience + ads declaration completed
- [ ] Internal testing release created and verified

## Launch Plan

- [ ] TestFlight internal testers complete smoke test
- [ ] Google Play internal testing smoke test complete
- [ ] Address critical bugs from internal testing
- [ ] Submit App Store release
- [ ] Start Google Play staged rollout (10-20%)
- [ ] Monitor auth errors / crashes / user feedback for 48 hours
